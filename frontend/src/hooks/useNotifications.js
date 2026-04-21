import { useEffect, useRef, useCallback } from 'react';
import api from '@/api/axios';

const POLL_INTERVAL = 30000; // 30 detik

export function useNotifications({ enabled = true } = {}) {
    const lastCheckRef   = useRef(new Date().toISOString());
    const permissionRef  = useRef(null);
    const intervalRef    = useRef(null);

    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') {
            permissionRef.current = 'granted';
            return true;
        }
        if (Notification.permission !== 'denied') {
            const perm = await Notification.requestPermission();
            permissionRef.current = perm;
            return perm === 'granted';
        }
        return false;
    }, []);

    const showNotification = useCallback((title, body, customerId) => {
        if (Notification.permission !== 'granted') return;

        const n = new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: `customer-${customerId}`,
            renotify: true,
        });

        n.onclick = () => {
            window.focus();
            n.close();
        };
    }, []);

    const poll = useCallback(async () => {
        try {
            const r = await api.get('/notifications', { params: { since: lastCheckRef.current } });
            const { messages, server_time } = r.data;

            if (messages.length > 0) {
                // Group by customer — hanya notif 1x per customer
                const byCustomer = {};
                messages.forEach(m => {
                    if (!byCustomer[m.customer_id]) byCustomer[m.customer_id] = [];
                    byCustomer[m.customer_id].push(m);
                });

                Object.values(byCustomer).forEach(msgs => {
                    const first = msgs[0];
                    const title = `💬 ${first.customer_name}`;
                    const body  = msgs.length > 1
                        ? `${msgs.length} pesan baru`
                        : first.content.slice(0, 80);
                    showNotification(title, body, first.customer_id);
                });
            }

            lastCheckRef.current = server_time;
        } catch {
            // Abaikan error polling (misal server mati)
        }
    }, [showNotification]);

    useEffect(() => {
        if (!enabled) return;

        requestPermission();

        // Mulai polling
        intervalRef.current = setInterval(poll, POLL_INTERVAL);

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [enabled, poll, requestPermission]);

    return { requestPermission };
}
