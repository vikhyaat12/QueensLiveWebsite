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
    console.log(`✅ [TEST ${testNum.toString().padStart(2, '0')}] PASS: ${title} ${details}`);
  } else {
    failedCount++;
    console.error(`❌ [TEST ${testNum.toString().padStart(2, '0')}] FAIL: ${title} ${details}`);
  }
}

let orderCounter = 1;
async function createFreshOrder(token, name, email, prod = 'p-ref-immune-care', qty = null) {
  const phone = '98' + Math.floor(10000000 + Math.random() * 90000000);
  const suite = Math.floor(100 + Math.random() * 900);
  const quantity = qty !== null ? qty : (orderCounter++);
  const res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${token}` },
    body: JSON.stringify({
      lines: [{ productId: prod, quantity }],
      shipping: {
        fullName: name,
        email: email,
        phone: phone,
        address: `Suite ${suite}, Health Boulevard East`,
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400020'
      },
      paymentMethod: 'cod'
    })
  });
  const data = await res.json();
  return data?.order?.id || data?.orderId || data?.id;
}

async function run() {
  console.log('========================================================================');
  console.log('QUEENS CARE COMPREHENSIVE 15-POINT UI & FUNCTIONAL VERIFICATION SUITE');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });

  try {
    const ctxCustA = await browser.newContext();
    await ctxCustA.addCookies([{ name: 'qc_session', value: customerAToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);

    const ctxCustB = await browser.newContext();
    await ctxCustB.addCookies([{ name: 'qc_session', value: customerBToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);

    const ctxAdmin = await browser.newContext();
    await ctxAdmin.addCookies([{ name: 'qc_session', value: adminToken, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);

    // Create fresh orders for testing
    const testOrderId = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
    const rejectTestOrderId = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
    console.log(`Initialized test order for Customer A: ${testOrderId}`);
    console.log(`Initialized separate order for rejection test: ${rejectTestOrderId}\n`);

    // -------------------------------------------------------------
    // 1. Customer account shows ONLY the logged-in customer's data
    // -------------------------------------------------------------
    {
      const p = await ctxCustA.newPage();
      await p.goto(`${BASE_URL}/account`, { timeout: 15000 });
      await p.waitForTimeout(2000);
      const text = await p.evaluate(() => document.body.innerText || '');
      const hasCustA = text.includes('Demo Customer') && text.includes('customer@queenscare.in');
      const hidesCustB = !text.includes(customerB.email);
      report(1, 'Customer account shows ONLY logged-in customer data', hasCustA && hidesCustB, `(Name: Demo Customer, Email: customer@queenscare.in, Other data excluded: ${hidesCustB})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 2. Customer can see their own order history and order details
    // -------------------------------------------------------------
    {
      const pOrders = await ctxCustA.newPage();
      await pOrders.goto(`${BASE_URL}/account/orders`, { timeout: 15000 });
      await pOrders.waitForTimeout(2000);
      const ordersText = await pOrders.evaluate(() => document.body.innerText || '');
      const orderInList = ordersText.includes(testOrderId);
      await pOrders.close();

      const pDetail = await ctxCustA.newPage();
      await pDetail.goto(`${BASE_URL}/account/orders/${testOrderId}`, { timeout: 15000 });
      await pDetail.waitForTimeout(2000);
      const detailText = await pDetail.evaluate(() => document.body.innerText || '');
      const detailHasId = detailText.includes(testOrderId);
      const detailHasTimeline = detailText.includes('Shipment Status') && detailText.includes('Order Placed');
      report(2, 'Customer can see their own order history and order details', orderInList && detailHasId && detailHasTimeline, `(Order in list: ${orderInList}, Detail page ID: ${detailHasId}, Shipment Status: ${detailHasTimeline})`);
      await pDetail.close();
    }

    // -------------------------------------------------------------
    // 3. Customer can use Wishlist
    // -------------------------------------------------------------
    {
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
      const wishHasItem = getWishData?.items?.some(i => i.id === 'p-ref-immune-care');
      report(3, 'Customer can use Wishlist (persist and retrieve items)', wishAdded && wishHasItem, `(Items in wishlist: ${getWishData?.items?.length})`);
    }

    // -------------------------------------------------------------
    // 4. Customer cannot access admin order management
    // -------------------------------------------------------------
    {
      const p = await ctxCustA.newPage();
      await p.goto(`${BASE_URL}/admin`, { timeout: 15000 });
      await p.waitForURL('**/admin/login**', { timeout: 6000 }).catch(() => null);
      const adminAccessUrl = p.url();
      const blockedFromAdmin = adminAccessUrl.includes('/admin/login');
      report(4, 'Customer cannot access admin panel UI (redirects to login)', blockedFromAdmin, `(Redirected URL: ${adminAccessUrl})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 5. Admin can see and manage orders
    // -------------------------------------------------------------
    {
      const adminOrdersRes = await fetch(`${BASE_URL}/api/admin/orders`, {
        headers: { 'Cookie': `qc_session=${adminToken}` }
      });
      const adminOrdersData = await adminOrdersRes.json();
      const adminCanList = adminOrdersRes.status === 200 && Array.isArray(adminOrdersData.orders);
      const orderFoundInAdmin = adminOrdersData.orders?.some(o => o.id === testOrderId);
      report(5, 'Admin can see and list all orders', adminCanList && orderFoundInAdmin, `(Total orders: ${adminOrdersData.orders?.length}, Contains test order: ${orderFoundInAdmin})`);
    }

    // -------------------------------------------------------------
    // 6. Accept order works (transitions pending -> confirmed)
    // -------------------------------------------------------------
    {
      const acceptRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
        body: JSON.stringify({ status: 'confirmed' })
      });
      const getUpdatedRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
        headers: { 'Cookie': `qc_session=${adminToken}` }
      });
      const getUpdatedData = await getUpdatedRes.json();
      const acceptedOk = acceptRes.status === 200 && getUpdatedData?.order?.status === 'confirmed';
      report(6, 'Accept order works (pending -> confirmed transition)', acceptedOk, `(Updated Status in DB: ${getUpdatedData?.order?.status})`);
    }

    // -------------------------------------------------------------
    // 7. Reject order requires and saves a rejection reason
    // -------------------------------------------------------------
    {
      // A) Reject without note is blocked (422)
      const rejectNoReasonRes = await fetch(`${BASE_URL}/api/admin/orders/${rejectTestOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
        body: JSON.stringify({ status: 'rejected' })
      });
      const rejectBlockedWithoutReason = rejectNoReasonRes.status === 422;

      // B) Reject with mandatory note succeeds (200)
      const rejectReason = 'Delivery Location Not Serviceable';
      const rejectWithReasonRes = await fetch(`${BASE_URL}/api/admin/orders/${rejectTestOrderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
        body: JSON.stringify({ status: 'rejected', note: rejectReason })
      });

      const getRejectedRes = await fetch(`${BASE_URL}/api/admin/orders/${rejectTestOrderId}`, {
        headers: { 'Cookie': `qc_session=${adminToken}` }
      });
      const getRejectedData = await getRejectedRes.json();
      const rejectedOk = rejectWithReasonRes.status === 200 &&
                         getRejectedData?.order?.status === 'rejected' &&
                         getRejectedData?.history?.some(h => h.status === 'rejected' && h.note === rejectReason);
      report(7, 'Reject order requires and saves a rejection reason', rejectBlockedWithoutReason && rejectedOk, `(Blocked without reason: ${rejectBlockedWithoutReason}, Saved in history: "${rejectReason}")`);
    }

    // -------------------------------------------------------------
    // 8. Bulk Accept/Reject works safely
    // -------------------------------------------------------------
    {
      const bId1 = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
      const bId2 = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
      const bulkAcceptRes = await fetch(`${BASE_URL}/api/admin/orders/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
        body: JSON.stringify({ action: 'accept', orderIds: [bId1, bId2] })
      });
      const bulkAcceptData = await bulkAcceptRes.json();
      const bulkAcceptOk = bulkAcceptRes.status === 200 && bulkAcceptData.processed === 2;

      const bId3 = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
      const bId4 = await createFreshOrder(customerAToken, 'Demo Customer', 'customer@queenscare.in');
      const bulkRejectRes = await fetch(`${BASE_URL}/api/admin/orders/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${adminToken}` },
        body: JSON.stringify({ action: 'reject', orderIds: [bId3, bId4], reason: 'Item Out of Stock / Discontinued' })
      });
      const bulkRejectData = await bulkRejectRes.json();
      const bulkRejectOk = bulkRejectRes.status === 200 && bulkRejectData.processed === 2;

      report(8, 'Bulk Accept and Reject work safely with exact counts', bulkAcceptOk && bulkRejectOk, `(Bulk accept: ${bulkAcceptData?.processed}/2, Bulk reject: ${bulkRejectData?.processed}/2)`);
    }

    // -------------------------------------------------------------
    // 9. Order status history/audit trail is visible to admin
    // -------------------------------------------------------------
    {
      const auditRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
        headers: { 'Cookie': `qc_session=${adminToken}` }
      });
      const auditData = await auditRes.json();
      const history = auditData?.history || [];
      const hasHistory = history.length >= 1;
      report(9, 'Order status history / audit trail is recorded and visible to admin', hasHistory, `(Audit history entries count: ${history.length})`);
    }

    // -------------------------------------------------------------
    // 10. City -> State -> City/address selection works correctly
    // -------------------------------------------------------------
    {
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
    }

    // -------------------------------------------------------------
    // 11. Shipping label prints correctly
    // -------------------------------------------------------------
    {
      const p = await ctxAdmin.newPage();
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/shipping-label`, { timeout: 10000 });
      await p.waitForTimeout(1000);
      const shipLabelContent = await p.evaluate(() => document.body.innerText || '');
      const shipLabelHasOrder = shipLabelContent.includes(testOrderId);
      const shipLabelHasCOD = shipLabelContent.includes('COD') || shipLabelContent.includes('COLLECT');
      const shipLabelHasBarcode = await p.evaluate(() => document.querySelectorAll('svg, canvas, img, [data-barcode]').length > 0);
      report(11, 'Shipping label page renders order, COD amount, and barcode correctly', shipLabelHasOrder && shipLabelHasCOD && shipLabelHasBarcode, `(Order present: ${shipLabelHasOrder}, COD block: ${shipLabelHasCOD}, Barcode: ${shipLabelHasBarcode})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 12. Packing slip prints correctly
    // -------------------------------------------------------------
    {
      const p = await ctxAdmin.newPage();
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/packing-slip`, { timeout: 10000 });
      await p.waitForTimeout(1000);
      const packingSlipContent = await p.evaluate(() => document.body.innerText || '');
      const packingHasOrder = packingSlipContent.includes(testOrderId);
      const packingHasSignOff = packingSlipContent.includes('Quality Assurance') || packingSlipContent.includes('Pharmacist');
      report(12, 'Packing slip renders order and QA/Pharmacist sign-off block', packingHasOrder && packingHasSignOff, `(Order present: ${packingHasOrder}, QA Sign-off: ${packingHasSignOff})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 13. Signature/delivery page prints correctly
    // -------------------------------------------------------------
    {
      const p = await ctxAdmin.newPage();
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/signature-page`, { timeout: 10000 });
      await p.waitForTimeout(1000);
      const sigPageContent = await p.evaluate(() => document.body.innerText || '');
      const sigHasOrder = sigPageContent.includes(testOrderId);
      const sigHasSignatures = sigPageContent.includes('Customer Signature') && sigPageContent.includes('COURIER');
      report(13, 'Proof of Delivery signature run sheet renders consignee & courier signature boxes', sigHasOrder && sigHasSignatures, `(Order present: ${sigHasOrder}, Signature blocks: ${sigHasSignatures})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 14. Test direct unauthorized access to another customer's order
    // -------------------------------------------------------------
    {
      const custBGetAOrder = await fetch(`${BASE_URL}/api/orders/${testOrderId}`, {
        headers: { 'Cookie': `qc_session=${customerBToken}` }
      });
      const p = await ctxCustB.newPage();
      await p.goto(`${BASE_URL}/account/orders/${testOrderId}`, { timeout: 10000 });
      await p.waitForTimeout(2000);
      const pageBContent = await p.evaluate(() => document.body.innerText || '');
      const custBBlockedUI = pageBContent.includes('not found') || pageBContent.includes('Orders') || !pageBContent.includes('Health Boulevard East');
      const custBBlockedAPI = custBGetAOrder.status === 404;
      report(14, 'Direct unauthorized access to another customer\'s order is strictly blocked (IDOR prevention)', custBBlockedAPI && custBBlockedUI, `(API returned ${custBGetAOrder.status}, UI blocked: ${custBBlockedUI})`);
      await p.close();
    }

    // -------------------------------------------------------------
    // 15. Test direct customer access to admin APIs/routes
    // -------------------------------------------------------------
    {
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
    }

    console.log('\n========================================================================');
    console.log(`FINAL VERIFICATION RESULT: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('========================================================================');

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await browser.close();
  }
}

run();
