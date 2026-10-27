import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

interface StoredSession {
  id: string;
  pin: string;
  title: string;
  message: string;
  hostName: string;
  supportCategory: string;
  allowAudio: boolean;
  allowDrawAnnotations: boolean;
  createdAt: number;
  status: 'waiting' | 'accepted' | 'rejected' | 'active' | 'ended';
  clientDevice?: any;
}

interface StoredSignal {
  id: string;
  sessionId: string;
  sender: 'host' | 'guest';
  type: string;
  payload: any;
  timestamp: number;
}

const sessions = new Map<string, StoredSession>();
const signals = new Map<string, StoredSignal[]>();
const sseClients = new Map<string, Set<{ res: ServerResponse; role: 'host' | 'guest' }>>();

// Helper to parse JSON body
function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function notifySse(sessionId: string, sender: 'host' | 'guest', eventData: any) {
  const listeners = sseClients.get(sessionId);
  if (!listeners) return;
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  listeners.forEach(client => {
    // Only send to the other party (or both if broadcast)
    if (client.role !== sender) {
      try {
        client.res.write(payload);
      } catch (e) {
        // Ignore dead sockets
      }
    }
  });
}

export function signalingPlugin(): Plugin {
  return {
    name: 'webrtc-signaling-plugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';
        if (!url.startsWith('/api/sessions')) {
          return next();
        }

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          return res.end();
        }

        try {
          // SSE stream: /api/sessions/:id/events?role=host|guest
          const eventsMatch = url.match(/^\/api\/sessions\/([^/?]+)\/events(?:\?(.*))?$/);
          if (eventsMatch && req.method === 'GET') {
            const sessionId = eventsMatch[1];
            const queryParams = new URLSearchParams(eventsMatch[2] || '');
            const role = (queryParams.get('role') || 'guest') as 'host' | 'guest';

            res.writeHead(200, {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
              'Access-Control-Allow-Origin': '*',
            });
            res.write(': keepalive\n\n');

            if (!sseClients.has(sessionId)) {
              sseClients.set(sessionId, new Set());
            }
            const clientObj = { res, role };
            sseClients.get(sessionId)!.add(clientObj);

            // Keep alive interval
            const keepAlive = setInterval(() => {
              try {
                res.write(': ping\n\n');
              } catch {
                clearInterval(keepAlive);
              }
            }, 15000);

            req.on('close', () => {
              clearInterval(keepAlive);
              sseClients.get(sessionId)?.delete(clientObj);
            });
            return;
          }

          // GET /api/sessions/find?pin=123456
          if (url.startsWith('/api/sessions/find') && req.method === 'GET') {
            const queryParams = new URLSearchParams(url.split('?')[1] || '');
            const pin = queryParams.get('pin');
            for (const session of sessions.values()) {
              if (session.pin === pin) {
                return sendJson(res, 200, session);
              }
            }
            return sendJson(res, 404, { error: 'Session not found' });
          }

          // POST /api/sessions - Create or update session
          if (url === '/api/sessions' && req.method === 'POST') {
            const data = await parseJsonBody(req);
            const id = data.id || `sess_${Math.random().toString(36).substring(2, 9)}`;
            const session: StoredSession = {
              id,
              pin: data.pin || Math.floor(100000 + Math.random() * 900000).toString(),
              title: data.title || 'طلب مشاركة الشاشة للدعم الفني',
              message: data.message || 'يرجى الموافقة على مشاركة الشاشة لتقديم المساعدة التقنية المباشرة.',
              hostName: data.hostName || 'مهندس الدعم الفني',
              supportCategory: data.supportCategory || 'دعم عام',
              allowAudio: Boolean(data.allowAudio),
              allowDrawAnnotations: Boolean(data.allowDrawAnnotations ?? true),
              createdAt: data.createdAt || Date.now(),
              status: data.status || 'waiting',
              clientDevice: data.clientDevice,
            };
            sessions.set(id, session);
            if (!signals.has(id)) {
              signals.set(id, []);
            }
            return sendJson(res, 200, session);
          }

          // GET /api/sessions/:id
          const sessionMatch = url.match(/^\/api\/sessions\/([^/?]+)$/);
          if (sessionMatch && req.method === 'GET') {
            const sessionId = sessionMatch[1];
            const session = sessions.get(sessionId);
            if (!session) {
              return sendJson(res, 404, { error: 'Session not found' });
            }
            return sendJson(res, 200, session);
          }

          // POST /api/sessions/:id/status
          const statusMatch = url.match(/^\/api\/sessions\/([^/?]+)\/status$/);
          if (statusMatch && req.method === 'POST') {
            const sessionId = statusMatch[1];
            const session = sessions.get(sessionId);
            if (!session) {
              return sendJson(res, 404, { error: 'Session not found' });
            }
            const body = await parseJsonBody(req);
            if (body.status) session.status = body.status;
            if (body.clientDevice) session.clientDevice = body.clientDevice;

            // Broadcast status change to SSE
            notifySse(sessionId, body.sender || 'guest', {
              type: 'status',
              status: session.status,
              clientDevice: session.clientDevice,
            });

            return sendJson(res, 200, session);
          }

          // POST /api/sessions/:id/signal
          const signalPostMatch = url.match(/^\/api\/sessions\/([^/?]+)\/signal$/);
          if (signalPostMatch && req.method === 'POST') {
            const sessionId = signalPostMatch[1];
            const body = await parseJsonBody(req);
            const signalList = signals.get(sessionId) || [];

            const signalItem: StoredSignal = {
              id: `sig_${Math.random().toString(36).substring(2, 9)}`,
              sessionId,
              sender: body.sender,
              type: body.type,
              payload: body.payload,
              timestamp: Date.now(),
            };

            signalList.push(signalItem);
            // Limit stored signals to last 200
            if (signalList.length > 200) signalList.shift();
            signals.set(sessionId, signalList);

            // Push to SSE clients immediately
            notifySse(sessionId, body.sender, signalItem);

            return sendJson(res, 200, { ok: true, id: signalItem.id });
          }

          // GET /api/sessions/:id/signals?since=123456&role=host|guest
          const signalsGetMatch = url.match(/^\/api\/sessions\/([^/?]+)\/signals(?:\?(.*))?$/);
          if (signalsGetMatch && req.method === 'GET') {
            const sessionId = signalsGetMatch[1];
            const queryParams = new URLSearchParams(signalsGetMatch[2] || '');
            const since = parseInt(queryParams.get('since') || '0', 10);
            const role = queryParams.get('role'); // target role that receives messages

            const signalList = signals.get(sessionId) || [];
            // Filter messages newer than 'since', sent by the OTHER party
            const relevant = signalList.filter(s => {
              if (s.timestamp <= since) return false;
              if (role && s.sender === role) return false; // don't return own messages
              return true;
            });

            return sendJson(res, 200, relevant);
          }

          next();
        } catch (err: any) {
          console.error('Signaling plugin error:', err);
          sendJson(res, 500, { error: err.message || 'Internal server error' });
        }
      });
    },
  };
}
