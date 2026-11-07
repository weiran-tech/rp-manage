import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, MOCK_STORAGE_KEY } from './transport';
import { getSession } from '@/utils/session';
import { signIn } from '@/test/session';
import { menus } from './seed';
import { hasPageComponent } from '@/utils/page-registry';
import type { MenuNode, UserView, PageResult, IdResult } from '@/types/api';

vi.unmock('@/mocks/transport');
async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await mockFetch(`/api-backend/${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
    const result = await response.json() as { code: number; data: T };
    expect(result.code).toBe(0);
    return result.data;
}
beforeEach(() => { localStorage.clear(); });

describe('独立原型数据流', () => {
    it('未登录拒绝受保护操作，登录校验后建立独立会话', async () => {
        const denied = await mockFetch('/api-backend/system/user/list');
        expect(denied.status).toBe(401);
        const wrong = await mockFetch('/api-backend/n/system/auth/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password: 'wrong' }) });
        expect((await wrong.json() as { code: number }).code).toBe(110101);
        await call('n/system/auth/login', 'POST', { username: 'admin', password: 'admin123' });
        expect(getSession()).toBe('1.prototype');
        expect((await call<PageResult<UserView>>('system/user/list')).total).toBe(28);
    });

    it('所有种子菜单都指向存在的页面入口', () => {
        function check(nodes: MenuNode[]) { nodes.forEach((node) => { if (node.component) expect(hasPageComponent(node.component), node.component).toBe(true); check(node.children); }); }
        check(menus);
    });

    it('用户增删改、筛选与分页保存到本地', async () => {
        signIn();
        const created = await call<IdResult>('system/user/create', 'POST', { username: 'prototype-user', nickname: '新用户', roleIds: [2] });
        await call(`system/user/update/${created.id}`, 'PUT', { nickname: '更新用户' });
        const found = await call<PageResult<UserView>>('system/user/list?keyword=prototype-user&page=1&pageSize=10');
        expect(found.total).toBe(1);
        expect(found.list[0]?.nickname).toBe('更新用户');
        expect(localStorage.getItem(MOCK_STORAGE_KEY)).toContain('更新用户');
        await call(`system/user/delete/${created.id}`, 'DELETE');
        expect((await call<PageResult<UserView>>('system/user/list?keyword=prototype-user')).total).toBe(0);
    });

    it('保存偏好、收藏与字典项', async () => {
        signIn();
        await call('system/auth/updatePreferences', 'PUT', { colorMode: 'dark' });
        expect(await call('system/auth/getPreferences')).toEqual({ colorMode: 'dark' });
        await call('system/auth/updateFavoriteMenus', 'PUT', { menuIds: [1, 1, 2] });
        expect(await call('system/auth/listFavoriteMenus')).toEqual([1, 2]);
        const created = await call<IdResult>('system/dict/createItem/2', 'POST', { label: '已完成', value: 'done' });
        const items = await call<Array<{ id: number }>>('system/dict/listItemsByCode/business_status');
        expect(items.some((item) => item.id === created.id)).toBe(true);
    });

    it('地区导出生成经过筛选的 CSV', async () => {
        signIn();
        const response = await mockFetch('/api-backend/region/area/export?keyword=杭州');
        expect(response.headers.get('Content-Type')).toContain('text/csv');
        const csv = await response.text();
        expect(csv).toContain('杭州市');
        expect(csv).not.toContain('西湖区');
    });

    it('批处理返回可浏览的模拟结果，序号在本地递增', async () => {
        signIn();
        const form = new FormData(); form.append('kind', 'demo_excel'); form.append('file', new File(['mock'], 'sample.xlsx'));
        const response = await mockFetch('/api-backend/system/batchJob/create', { method: 'POST', body: form });
        const result = await response.json() as { data: { id: number; succeeded: number } };
        expect(result.data.succeeded).toBe(3);
        const details = await call<{ total: number }>(`system/batchJob/listDetails/${result.data.id}`);
        expect(details.total).toBe(3);
        expect(await call('demo/sequence/next', 'POST', { type: 'order' })).toMatchObject({ sequence: 1 });
        expect(await call('demo/sequence/next', 'POST', { type: 'order' })).toMatchObject({ sequence: 2 });
    });

    it('未知路径返回明确错误并且不会发起网络请求', async () => {
        signIn();
        const network = vi.spyOn(globalThis, 'fetch');
        const response = await mockFetch('/api-backend/system/unknown/list');
        expect(response.status).toBe(404);
        expect(network).not.toHaveBeenCalled();
        network.mockRestore();
    });
});
