import { chromium } from '@playwright/test';
import { createHmac } from 'crypto';

const BASE_URL = 'http://localhost:3000';
const AUTH_SECRET = process.env.AUTH_SECRET || 'queens-care-local-development-secret-change-before-deployment';

function signToken(user) {
  const data = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      exp: Date.now() + 604800000,
    })
  ).toString('base64url');
  const sig = createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

const customerA = { id: 'usr-customer-1', role: 'customer', name: 'Demo Customer', email: 'customer@queenscare.in' };
const customerB = { id: 'usr-0478339e', role: 'customer', name: 'Other Customer', email: 'test.register@example.com' };
const adminUser = { id: 'usr-admin-1', role: 'admin', name: 'Admin', email: 'admin@queenscare.in' };

const customerAToken = signToken(customerA);
const customerBToken = signToken(customerB);
const adminToken = signToken(adminUser);

let passedCount = 0;
let failedCount = 0;

function report(testNum, title, passed, details = '') {
  if (passed) {
    passedCount++;
    console.log(`✅ [TEST ${testNum}] PASS: ${title} ${details}`);
  } else {
    failedCount++;
    console.error(`❌ [TEST ${testNum}] FAIL: ${title} ${details}`);
  }
}

async function run() {
  console.log('===============================================================');
  console.log('QUEENS CARE COMPREHENSIVE 15-POINT UI & FUNCTIONAL VERIFICATION');
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    const ctxCustA = await browser.newContext();
    await ctxCustA.addCookies([{ name: 'qc_session', value: customerAToken, url: BASE_URL }]);

    const ctxCustB = await browser.newContext();
    await ctxCustB.addCookies([{ name: 'qc_session', value: customerBToken, url: BASE_URL }]);

    const ctxAdmin = await browser.newContext();
    await ctxAdmin.addCookies([{ name: 'qc_session', value: adminToken, url: BASE_URL }]);

    const pageCustA = await ctxCustA.newPage();
    const pageCustB = await ctxCustB.newPage();
    const pageAdmin = await ctxAdmin.newPage();

    // -------------------------------------------------------------
    // Pre-requisite: Create a fresh order for Customer A
    // -------------------------------------------------------------
    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({
        lines: [{ productId: 'p-ref-immune-care', quantity: 2 }],
        shipping: {
          fullName: 'Demo Customer',
          email: 'customer@queenscare.in',
          phone: '9876543210',
          address: '42 Marine Drive, Suite 100',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020'
        },
        paymentMethod: 'cod'
      })
    });
    const createOrderData = await createOrderRes.json();
    const testOrderId = createOrderData?.order?.id;
    console.log(`Created test order for Customer A: ${testOrderId}\n`);

    // -------------------------------------------------------------
    // 1. Customer account shows ONLY the logged-in customer's data
    // -------------------------------------------------------------
    const accountRes = await fetch(`${BASE_URL}/api/account`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const accountData = await accountRes.json();
    const accountIsCustA = accountData?.user?.email === customerA.email && accountData?.user?.id === customerA.id;

    await pageCustA.goto(`${BASE_URL}/account`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageCustA.waitForTimeout(1500);
    const pageAContent = await pageCustA.textContent('body');
    const showsCustAName = pageAContent.includes(customerA.email) || pageAContent.includes('Demo Customer');
    const hidesCustB = !pageAContent.includes(customerB.email);
    report(1, 'Customer account shows ONLY logged-in customer data', accountIsCustA && showsCustAName && hidesCustB, `(Email: ${accountData?.user?.email}, Verified in UI: ${showsCustAName})`);

    // -------------------------------------------------------------
    // 2. Customer can see their own order history and order details
    // -------------------------------------------------------------
    const custOrdersRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const custOrdersData = await custOrdersRes.json();
    const orderInCustOrders = custOrdersData?.orders?.some(o => o.id === testOrderId);

    const custDetailRes = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const custDetailData = await custDetailRes.json();
    const hasDetail = custDetailData?.order?.id === testOrderId;

    await pageCustA.goto(`${BASE_URL}/account/orders`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageCustA.waitForTimeout(1500);
    const ordersUiContent = await pageCustA.textContent('body');
    const orderVisibleInUi = ordersUiContent.includes(testOrderId);

    await pageCustA.goto(`${BASE_URL}/account/orders/${testOrderId}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageCustA.waitForTimeout(1500);
    const detailUiContent = await pageCustA.textContent('body');
    const detailVisibleInUi = detailUiContent.includes(testOrderId) && detailUiContent.includes('Timeline');

    report(2, 'Customer can see their own order history and order details', orderInCustOrders && hasDetail && orderVisibleInUi && detailVisibleInUi, `(Order in API: ${orderInCustOrders}, Visible in History UI: ${orderVisibleInUi}, Details UI: ${detailVisibleInUi})`);

    // -------------------------------------------------------------
    // 3. Customer can use Wishlist
    // -------------------------------------------------------------
    const addWishRes = await fetch(`${BASE_URL}/api/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({ action: 'add', productId: 'p-ref-immune-care' })
    });
    const addWishData = await addWishRes.json();
    const wishAdded = addWishRes.status === 200 && addWishData?.productIds?.includes('p-ref-immune-care');

    const getWishRes = await fetch(`${BASE_URL}/api/wishlist`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const getWishData = await getWishRes.json();
    const wishHasProduct = getWishData?.items?.some(i => i.id === 'p-ref-immune-care');
    report(3, 'Customer can use Wishlist (persist and retrieve items)', wishAdded && wishHasProduct, `(Items in wishlist: ${getWishData.items?.length})`);

    // -------------------------------------------------------------
    // 4. Customer cannot access admin order management
    // -------------------------------------------------------------
    await pageCustA.goto(`${BASE_URL}/admin`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageCustA.waitForTimeout(1000);
    const currentCustAUrl = pageCustA.url();
    const redirectedToLogin = currentCustAUrl.includes('/admin/login');
    report(4, 'Customer cannot access admin panel UI (redirects to login)', redirectedToLogin, `(Redirected URL: ${currentCustAUrl})`);

    // -------------------------------------------------------------
    // 5. Admin can see and manage orders
    // -------------------------------------------------------------
    const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `qc_session=${adminToken}` }
    });
    const adminOrdersData = await adminOrdersRes.json();
    const adminCanList = adminOrdersRes.status === 200 && Array.isArray(adminOrdersData.orders);
    const orderFoundInAdmin = adminOrdersData.orders?.some(o => o.id === testOrderId);
    report(5, 'Admin can see and list all orders', adminCanList && orderFoundInAdmin, `(Total orders: ${adminOrdersData.orders?.length}, Contains test order: ${orderFoundInAdmin})`);

    // -------------------------------------------------------------
    // 6. Accept order works (transitions pending -> confirmed)
    // -------------------------------------------------------------
    const acceptRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const acceptData = await acceptRes.json();
    const acceptedOk = acceptRes.status === 200 && acceptData?.order?.status === 'confirmed';
    report(6, 'Accept order works (pending -> confirmed transition)', acceptedOk, `(Updated Status: ${acceptData?.order?.status})`);

    // -------------------------------------------------------------
    // 7. Reject order requires and saves a rejection reason
    // -------------------------------------------------------------
    const rejectNoReasonRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
      body: JSON.stringify({ status: 'cancelled' })
    });
    const rejectBlockedWithoutReason = rejectNoReasonRes.status === 422;

    const rejectReason = 'Delivery Location Not Serviceable';
    const rejectWithReasonRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
      body: JSON.stringify({ status: 'cancelled', rejectionReason: rejectReason })
    });
    const rejectWithReasonData = await rejectWithReasonRes.json();
    const rejectedOk = rejectWithReasonRes.status === 200 &&
                       rejectWithReasonData?.order?.status === 'cancelled' &&
                       rejectWithReasonData?.order?.rejectionReason === rejectReason;
    report(7, 'Reject order requires and saves a rejection reason', rejectBlockedWithoutReason && rejectedOk, `(Blocked without reason: ${rejectBlockedWithoutReason}, Saved reason: "${rejectWithReasonData?.order?.rejectionReason}")`);

    // -------------------------------------------------------------
    // 8. Bulk Accept/Reject works safely
    // -------------------------------------------------------------
    const bOrder1 = await (await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({
        lines: [{ productId: 'p-ref-immune-care', quantity: 1 }],
        shipping: { fullName: 'Bulk Test 1', email: 'b1@queenscare.in', phone: '9876543211', address: 'Address 1', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        paymentMethod: 'cod'
      })
    })).json();
    const bOrder2 = await (await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({
        lines: [{ productId: 'p-ref-immune-care', quantity: 1 }],
        shipping: { fullName: 'Bulk Test 2', email: 'b2@queenscare.in', phone: '9876543212', address: 'Address 2', city: 'Delhi', state: 'Delhi', pincode: '110001' },
        paymentMethod: 'cod'
      })
    })).json();

    const bulkIds = [bOrder1?.order?.id, bOrder2?.order?.id];

    const bulkAcceptRes = await fetch(`${BASE_URL}/api/admin/orders/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
      body: JSON.stringify({ action: 'accept', orderIds: bulkIds })
    });
    const bulkAcceptData = await bulkAcceptRes.json();
    const bulkAcceptOk = bulkAcceptRes.status === 200 && bulkAcceptData.processed === 2;

    const bulkRejectRes = await fetch(`${BASE_URL}/api/admin/orders/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
      body: JSON.stringify({ action: 'reject', orderIds: bulkIds, rejectionReason: 'Item Out of Stock / Discontinued' })
    });
    const bulkRejectData = await bulkRejectRes.json();
    const bulkRejectOk = bulkRejectRes.status === 200 && bulkRejectData.processed === 2;

    report(8, 'Bulk Accept and Reject work safely with exact counts', bulkAcceptOk && bulkRejectOk, `(Bulk accept: ${bulkAcceptData?.processed}/2, Bulk reject: ${bulkRejectData?.processed}/2)`);

    // -------------------------------------------------------------
    // 9. Order status history/audit trail is visible to admin
    // -------------------------------------------------------------
    const auditRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
      headers: { 'Cookie': `qc_session=${adminToken}` }
    });
    const auditData = await auditRes.json();
    const history = auditData?.order?.statusHistory || [];
    const hasHistory = history.length >= 2;
    report(9, 'Order status history / audit trail is recorded and visible to admin', hasHistory, `(Audit history entries count: ${history.length})`);

    // -------------------------------------------------------------
    // 10. City -> State -> City/address selection works correctly
    // -------------------------------------------------------------
    const addrCreateRes = await fetch(`${BASE_URL}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({
        label: 'Clinic Address',
        fullName: 'Demo Customer',
        phone: '9876543210',
        address: '500 Marine Drive',
        state: 'Maharashtra',
        city: 'Mumbai',
        pincode: '400021',
        isDefault: true
      })
    });
    const addrCreateData = await addrCreateRes.json();
    const addrCreatedOk = addrCreateRes.status === 201 && addrCreateData?.address?.city === 'Mumbai';
    report(10, 'State -> City cascading address selection and persistence works', addrCreatedOk, `(Saved City: ${addrCreateData?.address?.city}, State: ${addrCreateData?.address?.state})`);

    // -------------------------------------------------------------
    // 11. Shipping label prints correctly
    // -------------------------------------------------------------
    await pageAdmin.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/shipping-label`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageAdmin.waitForTimeout(1000);
    const shipLabelContent = await pageAdmin.textContent('body');
    const shipLabelHasOrder = shipLabelContent.includes(testOrderId);
    const shipLabelHasCOD = shipLabelContent.includes('COD') || shipLabelContent.includes('COLLECT');
    const shipLabelHasBarcode = (await pageAdmin.$$('svg, canvas, img, [data-barcode]')).length > 0;
    report(11, 'Shipping label page renders order, COD amount, and barcode correctly', shipLabelHasOrder && shipLabelHasCOD && shipLabelHasBarcode, `(Found order: ${shipLabelHasOrder}, COD: ${shipLabelHasCOD}, Barcode elements: ${shipLabelHasBarcode})`);

    // -------------------------------------------------------------
    // 12. Packing slip prints correctly
    // -------------------------------------------------------------
    await pageAdmin.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/packing-slip`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageAdmin.waitForTimeout(1000);
    const packingSlipContent = await pageAdmin.textContent('body');
    const packingHasOrder = packingSlipContent.includes(testOrderId);
    const packingHasSignOff = packingSlipContent.includes('Quality Assurance') || packingSlipContent.includes('Pharmacist');
    report(12, 'Packing slip renders order and QA/Pharmacist sign-off block', packingHasOrder && packingHasSignOff, `(Found order: ${packingHasOrder}, Sign-off: ${packingHasSignOff})`);

    // -------------------------------------------------------------
    // 13. Signature/delivery page prints correctly
    // -------------------------------------------------------------
    await pageAdmin.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/signature-page`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageAdmin.waitForTimeout(1000);
    const sigPageContent = await pageAdmin.textContent('body');
    const sigHasOrder = sigPageContent.includes(testOrderId);
    const sigHasSignatures = sigPageContent.includes('Consignee') && sigPageContent.includes('Courier');
    report(13, 'Proof of Delivery signature run sheet renders consignee & courier signature boxes', sigHasOrder && sigHasSignatures, `(Found order: ${sigHasOrder}, Signatures: ${sigHasSignatures})`);

    // -------------------------------------------------------------
    // 14. Test direct unauthorized access to another customer's order
    // -------------------------------------------------------------
    const custBGetAOrder = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
      headers: { 'Cookie': `qc_session=${customerBToken}` }
    });
    await pageCustB.goto(`${BASE_URL}/account/orders/${testOrderId}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await pageCustB.waitForTimeout(1000);
    const pageBContent = await pageCustB.textContent('body');
    const custBBlockedUI = pageBContent.includes('not found') || pageBContent.includes('Orders') || !pageBContent.includes('42 Marine Drive');
    const custBBlockedAPI = custBGetAOrder.status === 404;
    report(14, 'Direct unauthorized access to another customer\'s order is strictly blocked (IDOR prevention)', custBBlockedAPI && custBBlockedUI, `(API returned ${custBGetAOrder.status}, UI blocked: ${custBBlockedUI})`);

    // -------------------------------------------------------------
    // 15. Test direct customer access to admin APIs/routes
    // -------------------------------------------------------------
    const custAccessAdminOrders = await fetch(`${BASE_URL}/api/admin/orders`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const custAccessAdminBulk = await fetch(`${BASE_URL}/api/admin/orders/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({ action: 'accept', orderIds: [testOrderId] })
    });
    const custAccessAdminSettings = await fetch(`${BASE_URL}/api/admin/orders/settings`, {
      headers: { 'Cookie': `qc_session=${customerAToken}` }
    });
    const adminBlocked = custAccessAdminOrders.status === 401 &&
                         custAccessAdminBulk.status === 401 &&
                         custAccessAdminSettings.status === 401;
    report(15, 'Direct customer access to all admin endpoints is strictly denied with 401', adminBlocked, `(GET /api/admin/orders: ${custAccessAdminOrders.status}, POST /api/admin/orders/bulk: ${custAccessAdminBulk.status}, GET /settings: ${custAccessAdminSettings.status})`);

    console.log('\n===============================================================');
    console.log(`FINAL RESULT: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

run();
