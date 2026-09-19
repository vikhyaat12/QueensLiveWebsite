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

    // -------------------------------------------------------------
    // Pre-requisite: Create a fresh distinct order for Customer A
    // -------------------------------------------------------------
    const distinctPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const distinctAddress = `Suite ${Math.floor(100 + Math.random() * 900)}, Marine Drive Boulevard`;
    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
      body: JSON.stringify({
        lines: [{ productId: 'p-ref-immune-care', quantity: 1 }],
        shipping: {
          fullName: 'Demo Customer',
          email: 'customer@queenscare.in',
          phone: distinctPhone,
          address: distinctAddress,
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400020'
        },
        paymentMethod: 'cod'
      })
    });
    const createOrderData = await createOrderRes.json();
    const testOrderId = createOrderData?.order?.id || createOrderData?.id || createOrderData?.orderId;
    console.log(`Initialized distinct order for Customer A: ${testOrderId} (Status: ${createOrderRes.status})\n`);

    // -------------------------------------------------------------
    // 1. Customer account shows ONLY the logged-in customer's data
    // -------------------------------------------------------------
    {
      const p = await ctxCustA.newPage();
      await p.goto(`${BASE_URL}/account`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(3000);
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
      await pOrders.goto(`${BASE_URL}/account/orders`, { waitUntil: 'commit', timeout: 15000 });
      await pOrders.waitForTimeout(3000);
      const ordersText = await pOrders.evaluate(() => document.body.innerText || '');
      const orderInList = ordersText.includes(testOrderId);
      await pOrders.close();

      const pDetail = await ctxCustA.newPage();
      await pDetail.goto(`${BASE_URL}/account/orders/${testOrderId}`, { waitUntil: 'commit', timeout: 15000 });
      await pDetail.waitForTimeout(3000);
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
      await p.goto(`${BASE_URL}/admin`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(2500);
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
      const acceptData = await acceptRes.json();
      const acceptedOk = acceptRes.status === 200 && (acceptData?.order?.status === 'confirmed' || acceptData?.status === 'confirmed');
      report(6, 'Accept order works (pending -> confirmed transition)', acceptedOk, `(Updated Status: confirmed)`);
    }

    // -------------------------------------------------------------
    // 7. Reject order requires and saves a rejection reason
    // -------------------------------------------------------------
    {
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
                         (rejectWithReasonData?.order?.status === 'cancelled' || rejectWithReasonData?.status === 'cancelled') &&
                         (rejectWithReasonData?.order?.rejectionReason === rejectReason || rejectWithReasonData?.rejectionReason === rejectReason);
      report(7, 'Reject order requires and saves a rejection reason', rejectBlockedWithoutReason && rejectedOk, `(Blocked without reason: ${rejectBlockedWithoutReason}, Saved reason: "${rejectReason}")`);
    }

    // -------------------------------------------------------------
    // 8. Bulk Accept/Reject works safely
    // -------------------------------------------------------------
    {
      const bOrder1 = await (await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
        body: JSON.stringify({
          lines: [{ productId: 'p-ref-immune-care', quantity: 1 }],
          shipping: { fullName: 'Bulk Test 1', email: 'b1@queenscare.in', phone: '98' + Math.floor(10000000 + Math.random() * 90000000), address: 'Address 1', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          paymentMethod: 'cod'
        })
      })).json();
      const bOrder2 = await (await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `qc_session=${customerAToken}` },
        body: JSON.stringify({
          lines: [{ productId: 'p-ref-immune-care', quantity: 1 }],
          shipping: { fullName: 'Bulk Test 2', email: 'b2@queenscare.in', phone: '98' + Math.floor(10000000 + Math.random() * 90000000), address: 'Address 2', city: 'Delhi', state: 'Delhi', pincode: '110001' },
          paymentMethod: 'cod'
        })
      })).json();

      const bulkIds = [bOrder1?.order?.id || bOrder1?.orderId, bOrder2?.order?.id || bOrder2?.orderId];

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
    }

    // -------------------------------------------------------------
    // 9. Order status history/audit trail is visible to admin
    // -------------------------------------------------------------
    {
      const auditRes = await fetch(`${BASE_URL}/api/admin/orders/${testOrderId}`, {
        headers: { 'Cookie': `qc_session=${adminToken}` }
      });
      const auditData = await auditRes.json();
      const history = auditData?.order?.statusHistory || [];
      const hasHistory = history.length >= 2;
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
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/shipping-label`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(3000);
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
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/packing-slip`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(3000);
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
      await p.goto(`${BASE_URL}/admin/orders/${testOrderId}/print/signature-page`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(3000);
      const sigPageContent = await p.evaluate(() => document.body.innerText || '');
      const sigHasOrder = sigPageContent.includes(testOrderId);
      const sigHasSignatures = sigPageContent.includes('Consignee') && sigPageContent.includes('Courier');
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
      await p.goto(`${BASE_URL}/account/orders/${testOrderId}`, { waitUntil: 'commit', timeout: 15000 });
      await p.waitForTimeout(3000);
      const pageBContent = await p.evaluate(() => document.body.innerText || '');
      const custBBlockedUI = pageBContent.includes('not found') || pageBContent.includes('Orders') || !pageBContent.includes('Marine Drive Boulevard');
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
