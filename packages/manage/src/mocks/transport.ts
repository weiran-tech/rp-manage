import { createSeed, timestamp, type Row } from './seed';
import { CSRF_COOKIE, getSession } from '@/utils/session';

function text(value: unknown): string {
    return typeof value === 'string' ? value : typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
}

export const MOCK_STORAGE_KEY = 'prototype_mock_v1';
interface Database {
    tables: Record<string, Row[]>;
    preferences: unknown;
    favorites: number[];
    password: string;
    security: Record<string, unknown>;
    sequences: Record<string, number>;
}
function initial(): Database {
    return { tables: createSeed(), preferences: null, favorites: [], password: 'admin123', sequences: {},
        security: { passwordMinLength: 6, passwordMaxLength: 64, requireLower: false, requireUpper: false, requireDigit: false, requireSymbol: false, mfaEnabled: false, mfaRememberDays: 7, revision: 1 } };
}
function read(): Database {
    try {
        const saved = JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || 'null') as Database | null;
        if (saved?.tables?.user && saved.tables.menu) return saved;
    } catch { /* 无效数据回到种子。 */ }
    return initial();
}
function persist(db: Database) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(db));
}
export function resetMockData() {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    document.cookie = `${CSRF_COOKIE}=; Max-Age=0; Path=/`;
    window.location.assign('/login');
}
class MockError extends Error {
    constructor(message: string, readonly code = 100400, readonly status = 400) { super(message); }
}
const success = (data: unknown) => Response.json({ code: 0, message: '操作成功', data });
function tree(rows: Row[], region = false, parent: unknown = region ? null : 0): Row[] {
    return rows.filter((row) => (region ? row.parentCode : row.parentId) === parent).map((row) => ({
        ...row, children: tree(rows, region, region ? row.code : row.id),
    }));
}
function filtered(rows: Row[], params: URLSearchParams): Row[] {
    return rows.filter((row) => [...params].every(([key, value]) => {
        if (!value || ['page', 'pageSize', 'kinds'].includes(key)) return true;
        if (key === 'keyword') return ['name', 'title', 'username', 'nickname', 'phone', 'code', 'description', 'configKey', 'originalName'].some((field) => text(row[field]).toLowerCase().includes(value.toLowerCase()));
        if (key === 'userId') return String(row.id) === value;
        if (key === 'roleId') return Array.isArray(row.roleIds) && row.roleIds.includes(Number(value));
        const ranges: Record<string, [string, boolean]> = { createdStartTime: ['createdAt', true], createdEndTime: ['createdAt', false], lastLoginStartTime: ['lastLoginAt', true], lastLoginEndTime: ['lastLoginAt', false], startTime: ['createdAt', true], endTime: ['createdAt', false] };
        if (ranges[key]) { const [field, start] = ranges[key]; return !!row[field] && (start ? text(row[field]) >= value : text(row[field]) <= value); }
        return row[key] === undefined || text(row[key]) === value;
    }));
}
function page(rows: Row[], params: URLSearchParams) {
    const current = Math.max(1, Number(params.get('page')) || 1);
    const pageSize = Math.max(1, Number(params.get('pageSize')) || 20);
    return { list: rows.slice((current - 1) * pageSize, current * pageSize), total: rows.length, page: current, pageSize };
}
function requireRow(rows: Row[], id: number): Row {
    const row = rows.find((r) => r.id === id);
    if (!row) throw new MockError('记录不存在', 100404, 404);
    return row;
}
const nextId = (rows: Row[]) => Math.max(0, ...rows.map((row) => row.id)) + 1;

/** 浏览器内传输层：不发网络请求，静态构建与开发使用相同的数据逻辑。 */
export async function mockFetch(input: string, options: RequestInit = {}): Promise<Response> {
    options.signal?.throwIfAborted();
    const url = new URL(input, 'http://prototype.local');
    const segments = url.pathname.split('/').filter(Boolean);
    const method = options.method || 'GET';
    const form = options.body instanceof FormData ? options.body : null;
    const body: Record<string, unknown> = typeof options.body === 'string' ? JSON.parse(options.body) as Record<string, unknown> : {};
    const db = read();
    const publicRoute = segments[1] === 'n';
    const parts = publicRoute ? segments.slice(2) : segments.slice(1);
    const [module, resource = '', action = '', rawId = '', childId = ''] = parts;
    const id = Number(rawId);
    let data: unknown = null;
    try {
        if (!publicRoute && !getSession()) throw new MockError('请先登录原型', 100101, 401);
        const rows = db.tables[resource] ?? [];
        const userId = Number(getSession()?.split('.')[0] || 1);
        const me = db.tables.user!.find((row) => row.id === userId) ?? db.tables.user![0]!;
        if (resource === 'auth') {
            switch (action) {
                case 'listProviders': data = { passwordLoginEnabled: true, phoneLoginEnabled: true, providers: [] }; break;
                case 'sendPhoneCode': case 'sendBindPhoneCode': break;
                case 'login': case 'loginWithPhoneCode': {
                    const user = db.tables.user!.find((row) => action === 'login' ? row.username === body.username : row.phone === body.phone);
                    if (!user || user.status !== 'enabled' || (action === 'login' ? body.password !== db.password : body.code !== '123456')) throw new MockError('账号或凭据错误', 110101, 401);
                    document.cookie = `${CSRF_COOKIE}=${user.id}.prototype; Path=/; SameSite=Lax`;
                    data = { userId: user.id, expiresIn: 86400, mfaRequired: false }; break;
                }
                case 'logout': data = { ssoLogoutUrl: null }; break;
                case 'getCurrentUser': data = { ...me, hasPassword: true, roles: me.roleNames, permissions: ['*'] }; break;
                case 'listCurrentMenus': data = tree(db.tables.menu!); break;
                case 'getPreferences': data = db.preferences; break;
                case 'updatePreferences': db.preferences = body; break;
                case 'listFavoriteMenus': data = db.favorites; break;
                case 'updateFavoriteMenus': db.favorites = [...new Set(body.menuIds as number[])].slice(0, 50); break;
                case 'updateProfile': Object.assign(me, body); break;
                case 'updateUsername': me.username = body.username; break;
                case 'bindPhone':
                    if (body.code !== '123456') throw new MockError('演示验证码为 123456');
                    me.phone = body.phone; break;
                case 'verifyPassword': case 'updatePassword':
                    if ((body.password ?? body.oldPassword) !== db.password) throw new MockError('密码错误', 110101, 401);
                    if (action === 'updatePassword') db.password = String(body.newPassword);
                    break;
                case 'listCurrentIdentities': data = db.tables.identity!.filter((row) => row.userId === userId); break;
                case 'deleteCurrentIdentity': db.tables.identity = db.tables.identity!.filter((row) => row.id !== id); break;
                default: throw new MockError(`未实现的原型操作：${action}`, 100404, 404);
            }
        } else if (resource === 'security') {
            if (action === 'get') data = db.security;
            else if (action === 'updatePasswordRules') Object.assign(db.security, body, { passwordMinLength: body.minLength, passwordMaxLength: body.maxLength });
            else if (action === 'updateMfa') Object.assign(db.security, { mfaEnabled: body.enabled, mfaRememberDays: body.rememberDays });
            else throw new MockError('未知安全设置操作');
        } else if (resource === 'media') {
            if (action === 'getUploadSettings') {
                const value = (key: string, fallback: string) => text(db.tables.config!.find((row) => row.configKey === `system.upload.${key}`)?.configValue ?? fallback);
                data = Object.fromEntries(['image', 'video', 'file'].flatMap((kind) => [[`${kind}Formats`, value(`${kind}_formats`, 'txt').split(',')], [`${kind}MaxSizeMb`, Number(value(`${kind}_max_size_mb`, '20'))]]));
            } else if (action === 'getDirectUploadAuthorization') data = null;
            else if (action === 'uploadFile') {
                const file = form?.get('file');
                if (!(file instanceof File)) throw new MockError('请选择文件');
                if (file.size > 3 * 1024 * 1024) throw new MockError('原型本地预览最多支持 3 MB 文件');
                const content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader(); reader.onload = () => resolve(text(reader.result)); reader.onerror = () => reject(new Error('文件读取失败')); reader.readAsDataURL(file);
                });
                const fileId = nextId(db.tables.mediaLibrary!);
                data = { url: content, name: file.name, path: `mock/${fileId}/${file.name}`, size: file.size };
                db.tables.mediaLibrary!.push({ id: fileId, originalName: file.name, url: content, size: file.size, createdAt: timestamp, category: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.name.endsWith('.zip') ? 'archive' : 'document', references: [] });
            } else throw new MockError('未知上传操作');
        } else if (resource === 'sequence') {
            const type = String(body.type); db.sequences[type] = (db.sequences[type] ?? 0) + 1;
            data = { id: Object.keys(db.sequences).indexOf(type) + 1, type, sequence: db.sequences[type] };
        } else if (resource === 'batchJob') {
            if (action === 'list') data = rows.filter((row) => !url.searchParams.get('kinds') || url.searchParams.get('kinds')!.split(',').includes(String(row.kind)));
            else if (action === 'create') {
                const file = form?.get('file');
                if (!(file instanceof File)) throw new MockError('请选择文件');
                data = { id: nextId(rows), kind: form?.get('kind'), sourceName: file.name, status: 'succeeded', phase: 'finished', total: 3, selectedCount: 3, processed: 3, succeeded: 3, failed: 0, errorMessage: null, decidedAt: timestamp, createdAt: timestamp, finishedAt: timestamp };
                rows.unshift(data as Row);
            } else if (action === 'get') data = requireRow(rows, id);
            else if (action === 'cancel') { data = requireRow(rows, id); Object.assign(data!, { status: 'cancelled', phase: 'finished' }); }
            else if (action === 'listDetails') data = page(Array.from({ length: 3 }, (_, i) => ({ id: i + 1, itemNo: i + 1, itemName: `模拟条目 ${i + 1}`, stage: url.searchParams.get('stage') || 'processing', status: 'succeeded', message: '模拟处理完成', sourceLocation: `第 ${i + 1} 行`, displayData: '{"name":"演示条目"}', createdAt: timestamp })), url.searchParams);
            else throw new MockError('未知批处理操作');
        } else if (module === 'demo' && resource === 'batchItem' && action === 'list') {
            data = page(Array.from({ length: 3 }, (_, i) => ({ id: i + 1, itemNo: i + 1, itemName: `演示条目 ${i + 1}`, itemValue: `value-${i + 1}` })), url.searchParams);
        } else if (resource === 'config' && action.endsWith('Group') || resource === 'config' && action === 'listGroups') {
            const groups = db.tables.configGroup!;
            const group = groups.find((row) => row.key === rawId);
            if (action === 'listGroups') data = groups;
            else if (action === 'createGroup') { const record = { ...body, id: nextId(groups), groupKey: body.groupKey || 'config_system', canDelete: true, isBuiltin: false, createdAt: timestamp }; groups.push(record); data = { id: record.id }; }
            else if (!group) throw new MockError('分组不存在');
            else if (action === 'updateGroup') Object.assign(group, body);
            else if (action === 'deleteGroup') { if (db.tables.config!.some((row) => row.groupKey === rawId)) throw new MockError('请先删除分组内配置'); db.tables.configGroup = groups.filter((row) => row !== group); }
        } else if (resource === 'dict' && /Item/.test(action)) {
            const items = db.tables.dictItem!;
            const dict = db.tables.dict!.find((row) => action === 'listItemsByCode' ? row.code === decodeURIComponent(rawId) : row.id === id);
            if (action.startsWith('list')) data = items.filter((row) => row.dictId === dict?.id);
            else if (action === 'createItem') { const record = { ...body, dictId: id, id: nextId(items), status: body.status || 'enabled' }; items.push(record); data = { id: record.id }; }
            else if (action === 'updateItem') Object.assign(requireRow(items, Number(childId)), body);
            else if (action === 'deleteItem') db.tables.dictItem = items.filter((row) => row.id !== Number(childId));
        } else if (resource === 'user' && action.includes('Identit')) {
            const identities = db.tables.identity!;
            if (action === 'listIdentities') data = identities.filter((row) => row.userId === id);
            else if (action === 'createIdentity') { const record = { ...body, id: nextId(identities), userId: id, providerName: body.provider, createdAt: timestamp }; identities.push(record); data = { id: record.id }; }
            else if (action === 'deleteIdentity') db.tables.identity = identities.filter((row) => row.id !== Number(childId));
        } else if (db.tables[resource]) {
            const selection = filtered(rows, url.searchParams);
            switch (action) {
                case 'list': data = resource === 'menu' ? tree(rows) : resource === 'batchJob' || resource === 'area' ? selection : page(selection, url.searchParams); break;
                case 'listAll': case 'listOptions': data = selection; break;
                case 'listTree': case 'getEnabledTree': {
                    const selected = action === 'getEnabledTree' ? rows.filter((row) => row.status === 'enabled') : [...selection];
                    if (action === 'listTree') {
                        for (let cursor = 0; cursor < selected.length; cursor++) {
                            const parent = rows.find((row) => row.code === selected[cursor]!.parentCode);
                            if (parent && !selected.includes(parent)) selected.push(parent);
                        }
                    }
                    data = tree(selected, true); break;
                }
                case 'get': data = requireRow(rows, id); break;
                case 'export': {
                    const cell = (value: unknown) => `"${text(value).replaceAll('"', '""')}"`;
                    return new Response('\ufeffcode,name,level,parentCode\n' + selection.map((row) => [row.code, row.name, row.level, row.parentCode].map(cell).join(',')).join('\n'), { headers: { 'Content-Type': 'text/csv;charset=utf-8' } });
                }
                case 'create': {
                    if (['user', 'role', 'dict', 'area'].includes(resource) && rows.some((row) => (body.username && row.username === body.username) || (body.code && row.code === body.code))) throw new MockError('名称或编码已存在');
                    const record: Row = { status: 'enabled', isBuiltin: false, roleIds: [], roleNames: [], children: [], parentId: 0, visible: true, keepAlive: false, isExternal: false, sort: 0, createdAt: timestamp, updatedAt: timestamp, ...body, id: nextId(rows) };
                    if (resource === 'user') record.roleNames = db.tables.role!.filter((role) => (body.roleIds as number[]).includes(role.id)).map((role) => role.name);
                    rows.push(record); data = resource === 'area' ? record : { id: record.id }; break;
                }
                case 'update': {
                    const record = requireRow(rows, id);
                    if (resource === 'menu' && body.parentId !== undefined) {
                        let parent = rows.find((row) => row.id === body.parentId);
                        const seen = new Set<number>();
                        while (parent) {
                            if (parent.id === id || seen.has(parent.id)) throw new MockError('不能将菜单移入自身或子菜单');
                            seen.add(parent.id); parent = rows.find((row) => row.id === parent!.parentId);
                        }
                    }
                    Object.assign(record, body, { updatedAt: timestamp });
                    if (resource === 'user' && Array.isArray(body.roleIds)) record.roleNames = db.tables.role!.filter((role) => (body.roleIds as number[]).includes(role.id)).map((role) => role.name);
                    data = resource === 'area' ? record : null; break;
                }
                case 'assignMenus': requireRow(rows, id).menuIds = body.menuIds; break;
                case 'updateAccountField': requireRow(rows, id)[String(body.field)] = body.value; break;
                case 'updatePassword': if (id === 1) db.password = String(body.password); break;
                case 'delete':
                    if (requireRow(rows, id).isBuiltin) throw new MockError('内置记录不能删除');
                    if (resource === 'menu' && rows.some((row) => row.parentId === id)) throw new MockError('请先删除子菜单');
                    if (resource === 'area' && rows.some((row) => row.parentCode === requireRow(rows, id).code)) throw new MockError('请先删除下级地区');
                    if (resource === 'dict') db.tables.dictItem = db.tables.dictItem!.filter((row) => row.dictId !== id);
                    db.tables[resource] = rows.filter((row) => row.id !== id); break;
                default: throw new MockError(`未实现的原型操作：${url.pathname}`, 100404, 404);
            }
        } else throw new MockError(`未配置的 Mock 路径：${url.pathname}`, 100404, 404);
        if (method !== 'GET') persist(db);
        return success(data);
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error;
        const failure = error instanceof MockError ? error : new MockError(error instanceof DOMException && error.name === 'QuotaExceededError' ? '浏览器存储空间不足，请删除部分资源或重置 Mock' : '原型操作失败，请检查 Mock 数据');
        return Response.json({ code: failure.code, message: failure.message, data: null }, { status: failure.status });
    }
}
