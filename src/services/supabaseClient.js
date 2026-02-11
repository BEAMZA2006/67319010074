import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isUrlValid = (url) => {
    return url && (url.startsWith('http://') || url.startsWith('https://'));
}

let supabaseInstance;

if (!supabaseUrl || !isUrlValid(supabaseUrl)) {
    // === Demo Mode: In-memory Data Storage ===
    const authListeners = new Set();

    // Initial Mock Data (Load from localStorage if available)
    const STORAGE_KEY = 'eduflow_demo_db';
    const loadMockData = () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        return {
            contents: [],
            profiles: {
                'demo-user-id': { full_name: 'Demo User', role: 'learner' }
            },
            categories: [
                { id: 'cat1', name: 'คอมพิวเตอร์' },
                { id: 'cat2', name: 'ภาษาอังกฤษ' },
                { id: 'cat3', name: 'คณิตศาสตร์' },
                { id: 'cat4', name: 'ศิลปะ' }
            ],
            view_history: []
        };
    };

    let mockData = loadMockData();

    const saveMockData = () => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData));
        } catch (e) {
            console.warn('LocalStorage quota exceeded. Data will be kept in memory for this session.', e);
        }
    };

    const triggerListeners = (event, user) => {
        const session = user ? { user, access_token: 'demo-token' } : null;
        authListeners.forEach(fn => fn(event, session));
    };

    const createQueryChain = (table) => {
        const chain = {
            data: null,
            error: null,
            select: (cols) => {
                // ใช้ข้อมูลจาก Memory โดยตรง (เอา loadMockData ออกเพื่อป้องกันข้อมูลเก่าทับข้อมูลใหม่กรณี Save ไม่ได้)
                if (table === 'contents') {
                    chain.data = [...mockData.contents];
                } else if (table === 'categories') {
                    chain.data = [...mockData.categories];
                } else {
                    chain.data = mockData[table] || [];
                }
                return chain;
            },
            insert: (item) => {
                const newItem = {
                    id: 'demo-' + Math.random().toString(36).substr(2, 9),
                    created_at: new Date().toISOString(),
                    ...item,
                    profiles: { full_name: 'You (Demo User)' },
                    categories: { name: mockData.categories?.find(c => c.id === item.category_id)?.name || 'ทั่วไป' },
                    content_tags: []
                };
                if (Array.isArray(mockData[table])) {
                    mockData[table].unshift(newItem);
                    saveMockData();
                }
                chain.data = newItem;
                return {
                    select: () => ({
                        single: () => ({ data: newItem, error: null })
                    })
                };
            },
            update: (updates) => {
                return {
                    eq: (col, val) => {
                        if (Array.isArray(mockData[table])) {
                            mockData[table] = mockData[table].map(item =>
                                item[col] === val ? { ...item, ...updates } : item
                            );
                            saveMockData();
                        }
                        return { error: null };
                    }
                };
            },
            delete: () => {
                return {
                    eq: (col, val) => {
                        if (Array.isArray(mockData[table])) {
                            mockData[table] = mockData[table].filter(item => item[col] !== val);
                            saveMockData();
                        }
                        return { error: null };
                    }
                };
            },
            eq: (col, val) => {
                if (Array.isArray(chain.data)) {
                    chain.data = chain.data.filter(item => item[col] === val);
                }
                return chain;
            },
            not: () => chain,
            order: () => {
                // Simplified sorting
                return chain;
            },
            limit: (n) => {
                if (Array.isArray(chain.data)) {
                    chain.data = chain.data.slice(0, n);
                }
                return chain;
            },
            single: () => {
                return {
                    data: Array.isArray(chain.data) ? chain.data[0] : chain.data,
                    error: null
                };
            },
            // To be used with await
            then: (resolve) => {
                resolve({ data: chain.data, error: chain.error });
            }
        };
        return chain;
    };

    supabaseInstance = {
        auth: {
            onAuthStateChange: (fn) => {
                authListeners.add(fn);
                return { data: { subscription: { unsubscribe: () => authListeners.delete(fn) } } };
            },
            getSession: async () => ({ data: { session: null }, error: null }),
            signInWithPassword: async ({ email }) => {
                const user = {
                    id: 'demo-user-id',
                    email: email || 'demo@example.com',
                    user_metadata: { role: mockData.profiles['demo-user-id']?.role || 'learner' }
                };
                triggerListeners('SIGNED_IN', user);
                return { data: { user, session: { user } }, error: null };
            },
            signUp: async ({ email, options }) => {
                const role = options?.data?.role || 'learner';
                mockData.profiles['demo-user-id'] = { full_name: options?.data?.full_name || 'Demo User', role };
                const user = {
                    id: 'demo-user-id',
                    email: email || 'demo@example.com',
                    user_metadata: { role }
                };
                saveMockData();
                triggerListeners('SIGNED_UP', user);
                return { data: { user, session: { user } }, error: null };
            },
            signOut: async () => {
                triggerListeners('SIGNED_OUT', null);
                return { error: null };
            },
            updateUser: async ({ password }) => {
                return { data: { user: { id: 'demo-user-id' } }, error: null };
            }
        },
        from: (table) => createQueryChain(table),
        storage: { from: () => ({ upload: async () => ({ data: { path: 'demo.png' }, error: null }) }) }
    };
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseInstance
