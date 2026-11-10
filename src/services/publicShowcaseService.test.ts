import { expect, it, vi } from 'vitest';
import { apiGet } from '@/utils/apiClient';
import { fetchPublicShowcase, fetchPublicShowcaseGroups } from './publicShowcaseService';
vi.mock('@/utils/apiClient', () => ({ apiGet: vi.fn() }));
vi.mock('@/config/appConfig', () => ({ appConfig:{ apiBaseUrl:'https://myhoma.ir' } }));
it('consumes only the bounded public endpoint and drops unexpected metadata', async () => {
  vi.mocked(apiGet).mockResolvedValue({success:true,data:{results:[{image_url:'/api/products/showcase/images/opaque/',price:1000000,name:'SECRET',shop_name:'SECRET',extra_details:{dna:'SECRET'}}]}});
  const rows=await fetchPublicShowcase();
  expect(apiGet).toHaveBeenCalledWith('/products/showcase/',undefined,{skipAuth:true,signal:undefined});
  expect(rows).toEqual([{image_url:'https://myhoma.ir/api/products/showcase/images/opaque/',price:1000000}]);
});
it('keeps only category labels and photo-price rows in grouped previews', async () => {
  vi.mocked(apiGet).mockResolvedValue({success:true,data:{groups:[{category:{code:'lighting',label:'روشنایی',internal:'SECRET'},results:[{image_url:'/photo/',price:100,name:'SECRET'}]}]}});
  expect(await fetchPublicShowcaseGroups()).toEqual([{category:{code:'lighting',label:'روشنایی'},results:[{image_url:'https://myhoma.ir/photo/',price:100}]}]);
  expect(apiGet).toHaveBeenLastCalledWith('/products/showcase/groups/',undefined,{skipAuth:true,signal:undefined});
});
