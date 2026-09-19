"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CartLine } from "@/lib/commerce/types";
import { getCartLines, subscribeCart, clearCart } from "@/lib/client-cart";
import OrderConfirmationAnimation from "@/app/components/OrderConfirmationAnimation";
import LocationSelector from "@/app/components/LocationSelector";
import QueensCareFooter from "@/app/components/QueensCareFooter";

type Product = { id: string; slug: string; name: string; price: number; image: string; stock: number };
type Shipping = { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };
type Status = "idle" | "loading" | "error" | "success";

type PublicGateway = {
  id: string;
  provider: string;
  displayName: string;
  description?: string;
  icon?: string;
  mode: string;
  isConfigured: boolean;
  sort: number;
  codCharge?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  instructions?: string;
  publicKey?: string;
};

type ShippingRules = {
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee: number;
  codHandlingFee: number;
  estimatedDaysMetro: string;
  estimatedDaysNonMetro: string;
};

const empty: Shipping = { fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\-\s]{8,15}$/;

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Page() {
  const [lines, setLines] = useState<CartLine[]>(() => getCartLines());
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [shipping, setShipping] = useState<Shipping>(empty);
  const [errors, setErrors] = useState<Partial<Shipping>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showOrderReview, setShowOrderReview] = useState(false);

  // Customer Authentication Gate State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string; phone?: string } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string;
    label?: string;
    fullName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault?: boolean;
  }>>([]);
  const [authChecking, setAuthChecking] = useState(true);
  const [authGateTab, setAuthGateTab] = useState<"login" | "register">("login");
  const [authGateForm, setAuthGateForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [authGateLoading, setAuthGateLoading] = useState(false);
  const [authGateError, setAuthGateError] = useState("");

  // Dynamic Gateways & Shipping Rules
  const [gateways, setGateways] = useState<PublicGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("cod");
  const [shippingRules, setShippingRules] = useState<ShippingRules>({
    freeShippingThreshold: 1500,
    standardShippingFee: 99,
    expressShippingFee: 199,
    codHandlingFee: 0,
    estimatedDaysMetro: "2-3 business days",
    estimatedDaysNonMetro: "4-6 business days",
  });
  const [pincodeStatus, setPincodeStatus] = useState<{ message: string; serviceable: boolean; deliveryDays?: string } | null>(null);

  // Optional Prescription Upload State
  const [prescriptionKey, setPrescriptionKey] = useState<string>("");
  const [prescriptionName, setPrescriptionName] = useState<string>("");
  const [prescriptionUploading, setPrescriptionUploading] = useState<boolean>(false);
  const [prescriptionError, setPrescriptionError] = useState<string>("");

  // Donation State
  const [donationConfig, setDonationConfig] = useState<{
    enabled: boolean; title: string; description: string; causeName: string;
    presetAmounts: number[]; customAmountEnabled: boolean;
    customMin: number; customMax: number; label: string; thankYouMessage: string;
  } | null>(null);
  const [donationAmount, setDonationAmount] = useState(0);
  const [donationCustomInput, setDonationCustomInput] = useState("");
  const [donationSelectedPreset, setDonationSelectedPreset] = useState<number | null>(null);

  // Server-side pricing breakdown
  const [serverBreakdown, setServerBreakdown] = useState<Record<string, unknown> | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const handlePrescriptionUpload = async (file: File) => {
    setPrescriptionUploading(true);
    setPrescriptionError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/checkout/prescription", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.prescriptionKey) {
        setPrescriptionKey(data.prescriptionKey);
        setPrescriptionName(data.filename || file.name);
      } else {
        setPrescriptionError(data.error || "Prescription upload failed.");
      }
    } catch {
      setPrescriptionError("Network error uploading prescription.");
    }
    setPrescriptionUploading(false);
  };

  const removePrescription = () => {
    setPrescriptionKey("");
    setPrescriptionName("");
    setPrescriptionError("");
  };

  const fetchProducts = () =>
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => Array.isArray(d?.products) && setProducts(d.products))
      .catch(() => setProductError(true))
      .finally(() => setCatalogLoaded(true));

  const fetchGatewaysAndRules = async () => {
    try {
      const [gRes, rRes] = await Promise.all([
        fetch("/api/payments/public-gateways"),
        fetch("/api/shipping/rules"),
      ]);
      const gData = await gRes.json();
      const rData = await rRes.json();

      if (Array.isArray(gData.gateways) && gData.gateways.length > 0) {
        setGateways(gData.gateways);
        // Default to first enabled gateway or cod
        const defaultGw = gData.gateways.find((g: PublicGateway) => g.isConfigured) || gData.gateways[0];
        setSelectedGateway(defaultGw.provider);
      }
      if (rData && rData.freeShippingThreshold !== undefined) {
        setShippingRules(rData);
      }
    } catch {}
  };

  const loadProducts = () => {
    setProductError(false);
    fetchProducts();
  };

  // Fetch donation config
  useEffect(() => {
    fetch("/api/checkout/pricing")
      .then((r) => r.json())
      .then((d) => { if (d?.donation) setDonationConfig(d.donation); })
      .catch(() => {});
  }, []);

  const items = useMemo(() => lines.map((l) => {
    const p = products.find((x) => x.id === l.productId || x.slug === l.productId);
    return p ? { ...p, quantity: l.quantity } : null;
  }).filter(Boolean) as (Product & { quantity: number })[], [lines, products]);

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const eligibleSubtotal = Math.max(0, subtotal - couponDiscount);
  const freeThreshold = shippingRules.freeShippingThreshold || 1500;
  const standardFee = shippingRules.standardShippingFee ?? 99;
  const shippingFee = subtotal === 0 ? 0 : eligibleSubtotal >= freeThreshold ? 0 : standardFee;

  // Active gateway details
  const currentGateway = gateways.find(g => g.provider === selectedGateway) || {
    id: "gw-cod",
    provider: "cod",
    displayName: "Cash on Delivery (COD)",
    codCharge: 0,
    isConfigured: true,
  };

  const codChargeClient = selectedGateway === "cod" ? Number(currentGateway.codCharge || shippingRules.codHandlingFee || 0) : 0;
  const donation = donationConfig?.enabled ? donationAmount : 0;
  // Use server-side breakdown as authoritative total when available
  const total = serverBreakdown ? Number(serverBreakdown.grandTotal || 0) : Math.max(0, subtotal + shippingFee + codChargeClient - couponDiscount + donation);
  const serverShipping = serverBreakdown ? Number(serverBreakdown.shippingCharge || 0) : shippingFee;
  const serverCodFee = serverBreakdown ? Number(serverBreakdown.codFee || 0) : codChargeClient;
  const serverGst = serverBreakdown ? Number(serverBreakdown.totalGst || 0) : 0;
  const serverCgst = serverBreakdown ? Number(serverBreakdown.totalCgst || 0) : 0;
  const serverSgst = serverBreakdown ? Number(serverBreakdown.totalSgst || 0) : 0;
  const serverIgst = serverBreakdown ? Number(serverBreakdown.totalIgst || 0) : 0;
  const serverOtherCharges = serverBreakdown ? Number(serverBreakdown.totalOtherCharges || 0) : 0;
  const serverDonation = serverBreakdown ? Number(serverBreakdown.donationAmount || 0) : donation;
  const serverRoundOff = serverBreakdown ? Number(serverBreakdown.roundOff || 0) : 0;
  const bagEmpty = catalogLoaded && (lines.length === 0 || items.length === 0);

  // Fetch server-side pricing preview whenever inputs change (debounced)
  useEffect(() => {
    if (bagEmpty || !shipping.state) return;
    const timer = setTimeout(() => {
      setPricingLoading(true);
      fetch("/api/checkout/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map(i => ({ productId: i.slug, name: i.name, unitPrice: i.price, quantity: i.quantity })),
          shippingState: shipping.state,
          shippingMethod: "standard",
          donationAmount: donationConfig?.enabled ? donationAmount : 0,
          paymentMethod: selectedGateway,
        }),
      })
        .then(r => r.json())
        .then(d => { if (d.breakdown) setServerBreakdown(d.breakdown); })
        .catch(() => {})
        .finally(() => setPricingLoading(false));
    }, 600);
    return () => clearTimeout(timer);
  }, [lines, products, shipping.state, donationAmount, selectedGateway, donationConfig?.enabled]);

  useEffect(() => {
    setLines(getCartLines());
    fetchProducts();
    fetchGatewaysAndRules();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) {
          setCurrentUser(d.user);
          setShipping((prev) => ({
            ...prev,
            fullName: prev.fullName || d.user.name || "",
            email: prev.email || d.user.email || "",
            phone: prev.phone || d.user.phone || "",
          }));

          fetch("/api/addresses")
            .then((ar) => ar.json())
            .then((ad) => {
              if (Array.isArray(ad?.addresses) && ad.addresses.length > 0) {
                setSavedAddresses(ad.addresses);
                const def = ad.addresses.find((a: Record<string, unknown>) => a.isDefault) || ad.addresses[0];
                if (def) {
                  setShipping((prev) => ({
                    ...prev,
                    fullName: def.fullName || prev.fullName,
                    phone: def.phone || prev.phone,
                    address: def.address || prev.address,
                    city: def.city || prev.city,
                    state: def.state || prev.state,
                    pincode: def.pincode || prev.pincode,
                  }));
                }
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false));

    // Analytics: checkout start
    try { ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_checkout_start?.(); } catch {}
    return subscribeCart((nextLines) => setLines(nextLines));
  }, []);

  // Check pincode serviceability dynamically
  useEffect(() => {
    if (/^\d{6}$/.test(shipping.pincode)) {
      fetch(`/api/shipping/serviceability?pincode=${encodeURIComponent(shipping.pincode)}&subtotal=${subtotal}`)
        .then(r => r.json())
        .then(d => {
          if (d.serviceable) {
            setPincodeStatus({
              serviceable: true,
              message: d.message || `Delivery in ${d.estimatedDelivery} via ${d.courier}`,
              deliveryDays: d.estimatedDelivery,
            });
          } else {
            setPincodeStatus({
              serviceable: false,
              message: d.message || "Pincode is not serviceable.",
            });
          }
        })
        .catch(() => {
          setPincodeStatus(null);
        });
    } else {
      setPincodeStatus(null);
    }
  }, [shipping.pincode, subtotal]);

  const validate = () => {
    const e: Partial<Shipping> = {};
    if (!shipping.fullName.trim()) e.fullName = "Full name is required.";
    if (!EMAIL.test(shipping.email)) e.email = "Enter a valid email.";
    if (!PHONE.test(shipping.phone)) e.phone = "Enter a valid phone number.";
    if (shipping.address.trim().length < 8) e.address = "Enter your complete address.";
    if (!shipping.city.trim()) e.city = "City is required.";
    if (!shipping.state.trim()) e.state = "State is required.";
    if (!/^\d{6}$/.test(shipping.pincode)) e.pincode = "Enter a valid 6-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k: keyof Shipping, v: string) => {
    setShipping((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const field = (k: keyof Shipping, label: string, placeholder: string, type = "text", cls = "") => (
    <div className={`checkout-field ${cls}`}>
      <label>{label} *</label>
      <input type={type} value={shipping[k]} onChange={(e) => setField(k, e.target.value)} placeholder={placeholder} />
      {errors[k] && <em>{errors[k]}</em>}
    </div>
  );

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, subtotal }) });
      const d = await r.json();
      if (r.ok) { setCouponDiscount(d.discount); setCouponMessage(`Coupon applied! You save ${inr(d.discount)}.`); }
      else { setCouponDiscount(0); setCouponMessage(d.error || "Invalid coupon."); }
    } catch { setCouponMessage("Could not validate coupon."); }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponCode(""); setCouponDiscount(0); setCouponMessage(""); };

  const handleAuthGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthGateLoading(true);
    setAuthGateError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authGateForm.email, password: authGateForm.password, rememberMe: true }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setShipping((prev) => ({
          ...prev,
          fullName: prev.fullName || data.user.name || "",
          email: prev.email || data.user.email || "",
          phone: prev.phone || data.user.phone || "",
        }));
      } else {
        setAuthGateError(data.error || "Invalid email or password.");
      }
    } catch {
      setAuthGateError("Failed to sign in. Please try again.");
    }
    setAuthGateLoading(false);
  };

  const handleAuthGateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthGateLoading(true);
    setAuthGateError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authGateForm),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        setShipping((prev) => ({
          ...prev,
          fullName: prev.fullName || data.user.name || "",
          email: prev.email || data.user.email || "",
          phone: prev.phone || data.user.phone || "",
        }));
      } else {
        setAuthGateError(data.error || "Failed to create account.");
      }
    } catch {
      setAuthGateError("Failed to register. Please try again.");
    }
    setAuthGateLoading(false);
  };

  const placeOrder = () => {
    setNotice("");
    if (!currentUser) {
      setNotice("Authentication required. Please sign in or create an account to place an order.");
      setStatus("error");
      return;
    }
    if (bagEmpty) return setNotice("Your care bag is empty. Add a product before checking out.");
    if (!validate()) return setNotice("Please fix the highlighted fields.");
    setShowOrderReview(true);
  };

  const executePlaceOrder = async () => {
    setShowOrderReview(false);
    setStatus("loading");

    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => ({ productId: i.slug, quantity: i.quantity })),
          shipping,
          couponCode: couponCode || undefined,
          paymentMethod: selectedGateway,
          shippingMethod: "standard",
          prescriptionKey: prescriptionKey || undefined,
          prescriptionFilename: prescriptionName || undefined,
          donationAmount: donation || undefined,
        })
      });

      const j = await r.json();
      if (!r.ok) {
        setStatus("error");
        return setNotice(j.error || "We could not place your order.");
      }

      const createdOrder = j.order;
      setOrderId(createdOrder.id);
      setPaidTotal(createdOrder.total);

      // Analytics: order placed — authoritative values from the server pricing engine.
      // Idempotent: QueensCareAnalytics forwards a purchase once per transaction_id.
      try {
        const bd = createdOrder.breakdown || {};
        ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_order_placed?.(
          createdOrder.id,
          createdOrder.total,
          {
            transaction_id: createdOrder.id,
            value: createdOrder.total,
            currency: "INR",
            tax: Number(bd.totalGst || 0),
            shipping: Number(bd.shippingCharge || 0) + Number(bd.codFee || 0),
            coupon: couponCode || undefined,
            items: (createdOrder.lines || items).map((l: { slug?: string; productId?: string; name?: string; quantity?: number; unitPrice?: number }) => ({
              item_id: l.productId || l.slug,
              item_name: l.name,
              quantity: l.quantity,
              price: l.unitPrice,
            })),
          }
        );
      } catch {}

      // Connect to selected payment provider
      if (selectedGateway === "cod") {
        clearCart();
        setLines([]);
        setStatus("success");
      } else if (selectedGateway === "razorpay") {
        // Authoritative Razorpay checkout
        setNotice("Contacting payment gateway…");
        const payRes = await fetch("/api/checkout/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrder.id, provider: "razorpay" }),
        });
        const payData = await payRes.json();

        if (!payRes.ok || payData.status === "not_configured") {
          setStatus("error");
          setNotice(payData.error || "Razorpay is not configured with live API credentials. Please select Cash on Delivery or configure API keys in Admin.");
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setStatus("error");
          setNotice("Unable to load secure Razorpay gateway. Please check your network connection or select Cash on Delivery.");
          return;
        }

        const RazorpayWindow = (window as unknown as { Razorpay: new (opts: Record<string, unknown>) => { open: () => void; on: (evt: string, cb: (res: Record<string, unknown>) => void) => void } }).Razorpay;
        if (!RazorpayWindow) {
          setStatus("error");
          setNotice("Payment interface could not be initialized in this browser. Please try again.");
          return;
        }

        const options: Record<string, unknown> = {
          key: payData.key,
          amount: payData.amount,
          currency: payData.currency || "INR",
          name: "Queens Care Laboratories",
          description: `Order #${createdOrder.id}`,
          image: "/images/brand/queens-care-horizontal-purple.png",
          order_id: payData.razorpayOrderId,
          prefill: {
            name: shipping.fullName,
            email: shipping.email,
            contact: shipping.phone,
          },
          notes: {
            orderId: createdOrder.id,
          },
          theme: {
            color: "#2A0F3A",
          },
          handler: async function (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
            try {
              setStatus("loading");
              setNotice("Verifying cryptographic payment signature with bank…");
              const vRes = await fetch("/api/checkout/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: createdOrder.id,
                  provider: "razorpay",
                  razorpay_order_id: res.razorpay_order_id,
                  razorpay_payment_id: res.razorpay_payment_id,
                  razorpay_signature: res.razorpay_signature,
                }),
              });
              const vData = await vRes.json();

              if (vRes.ok && vData.ok) {
                // Authoritative payment confirmed by server!
                clearCart();
                setLines([]);
                setStatus("success");
                setNotice("");
              } else {
                setStatus("error");
                setNotice(vData.error || `Payment verification failed. If money was deducted, save Order ID #${createdOrder.id} and contact support.`);
              }
            } catch {
              setStatus("error");
              setNotice(`Network error during payment verification. Please check your order status under My Orders (#${createdOrder.id}).`);
            }
          },
          modal: {
            ondismiss: function () {
              setStatus("idle");
              setNotice("Payment window was closed. Your order was not charged and your care bag items are saved.");
            },
          },
        };

        const rzp = new RazorpayWindow(options);
        rzp.on("payment.failed", function (failResp: Record<string, unknown>) {
          const description = (failResp?.error as { description?: string })?.description;
          setStatus("error");
          setNotice(description || "Payment failed at the gateway. Please try another card/UPI or select Cash on Delivery.");
        });

        rzp.open();
      } else {
        // Other digital gateways (Stripe, Cashfree, PayU, PhonePe)
        const payRes = await fetch("/api/checkout/payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrder.id, provider: selectedGateway }),
        });
        const payData = await payRes.json();

        if (!payRes.ok || payData.status === "not_configured") {
          setStatus("error");
          setNotice(payData.error || `${currentGateway.displayName || selectedGateway} is not configured with live credentials. Please select Razorpay or Cash on Delivery.`);
          return;
        }

        // Keep cart intact, inform customer that direct modal is active for Razorpay and COD
        setStatus("error");
        setNotice(`Direct modal integration for ${currentGateway.displayName || selectedGateway} is in configuration. Please select Razorpay (supports UPI, Cards, Netbanking) or Cash on Delivery to complete checkout.`);
      }
    } catch {
      setStatus("error");
      setNotice("A network error occurred. Please try again.");
    }
  };

  if (status === "success") return (
    <main className="checkout-main">
      <div className="checkout-success">
        <OrderConfirmationAnimation />
        <p className="eyebrow">Order confirmed</p>
        <h1>Thank you, {shipping.fullName.split(" ")[0] || "friend"}.</h1>
        <p className="checkout-success-sub">
          Your order <b>{orderId}</b> has been placed successfully.
          {selectedGateway === "cod" ? " You can pay with cash or UPI upon delivery." : " Payment received."}
          A confirmation email is on its way to {shipping.email}.
        </p>
        <div className="checkout-success-total"><span>Amount</span><b>{inr(paidTotal)}</b></div>
        <div className="checkout-ctas"><Link href="/" className="button">Continue shopping</Link><Link href="/account" className="text-link">View your orders <span>→</span></Link></div>
        <button className="checkout-anchor" onClick={() => { setStatus("idle"); setShipping(empty); setErrors({}); }}>Place another order</button>
      </div>
    </main>
  );

  return (
    <>
      <main className="checkout-main">
        <header className="checkout-header" style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(42, 15, 58, 0.08)" }}>
          <Link href="/" aria-label="Queens Care Laboratories" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand/queens-care-horizontal-purple.png"
              alt="Queens Care Laboratories"
              style={{ height: "40px", width: "auto", maxWidth: "200px", objectFit: "contain", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/brand/queens-care-horizontal-gold.png";
              }}
            />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 11, color: "#64748B", display: "inline-flex", alignItems: "center", gap: 5 }}>
              🔒 256-bit SSL Secure
            </span>
            <Link href="/cart" className="checkout-back" style={{ fontSize: 12.5, color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}>
              ← Back to cart
            </Link>
          </div>
        </header>
      <div className="checkout-grid">
        <section className="checkout-form">
          <p className="eyebrow">Secure checkout</p>
          <h1>Almost yours.</h1>
          {!catalogLoaded ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#64748B" }}>
              <div style={{ margin: "0 auto 16px", width: 36, height: 36, border: "3px solid rgba(42, 15, 58, 0.1)", borderTopColor: "#2A0F3A", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Securing pharmaceutical checkout &amp; validating essentials...</p>
            </div>
          ) : bagEmpty ? (
            <div className="checkout-empty-bag" role="status">
              <span className="cart-empty-mark">🛍️</span>
              <h2>Your care bag is empty.</h2>
              <p>Add a product to your bag before checking out.</p>
              <Link href="/#collection" className="button">Explore the collection <span>→</span></Link>
            </div>
          ) : (
            <>
              {productError && (
                <div className="cart-notice" role="alert">
                  <p>We had trouble loading the latest product details. Please try again.</p>
                  <button onClick={loadProducts}>Retry</button>
                </div>
              )}

              {/* Authentication Gate Requirement 1 & 16 */}
              {!currentUser ? (
                <div
                  style={{
                    background: "#fff",
                    border: "1.5px solid var(--purple, #2A0F3A)",
                    borderRadius: 8,
                    padding: "28px 24px",
                    marginBottom: 28,
                    boxShadow: "0 4px 16px rgba(42,15,58,0.06)",
                  }}
                >
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "var(--gold, #b8860b)", fontWeight: 700, display: "block", marginBottom: 6 }}>
                    Authentication Required
                  </span>
                  <h2 style={{ font: "24px var(--font-display, Georgia, serif)", margin: "0 0 6px", color: "var(--purple, #240e35)", fontWeight: 400 }}>
                    Sign in to continue
                  </h2>
                  <p style={{ fontSize: 13.5, color: "var(--ink, #333)", margin: "0 0 6px", fontWeight: 500 }}>
                    Create your Queens Care account to securely place and track your order.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: "0 0 18px", lineHeight: 1.5 }}>
                    Your orders, delivery details and order history will be securely saved to your account.
                  </p>

                  <div style={{ display: "flex", gap: 10, borderBottom: "1.5px solid #eee", marginBottom: 18 }}>
                    <button
                      type="button"
                      onClick={() => { setAuthGateTab("login"); setAuthGateError(""); }}
                      style={{
                        padding: "8px 16px",
                        background: "none",
                        border: "none",
                        borderBottom: authGateTab === "login" ? "2.5px solid var(--purple, #240e35)" : "2.5px solid transparent",
                        color: authGateTab === "login" ? "var(--purple, #240e35)" : "#777",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthGateTab("register"); setAuthGateError(""); }}
                      style={{
                        padding: "8px 16px",
                        background: "none",
                        border: "none",
                        borderBottom: authGateTab === "register" ? "2.5px solid var(--purple, #240e35)" : "2.5px solid transparent",
                        color: authGateTab === "register" ? "var(--purple, #240e35)" : "#777",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      Create Account
                    </button>
                  </div>

                  {authGateError && (
                    <div style={{ padding: "10px 14px", background: "#ffebee", border: "1px solid #ffcdd2", borderRadius: 4, color: "#c62828", fontSize: 12, marginBottom: 16 }}>
                      {authGateError}
                    </div>
                  )}

                  {authGateTab === "login" ? (
                    <form onSubmit={handleAuthGateLogin} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={authGateForm.email}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, email: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={authGateForm.password}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, password: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <button
                        type="submit"
                        disabled={authGateLoading}
                        style={{
                          padding: "11px 18px",
                          background: "var(--purple, #240e35)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          cursor: authGateLoading ? "wait" : "pointer",
                        }}
                      >
                        {authGateLoading ? "Signing in…" : "Sign In & Continue →"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleAuthGateRegister} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={authGateForm.name}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, name: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <input
                        type="tel"
                        required
                        placeholder="Mobile Number (10 digits)"
                        value={authGateForm.phone}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, phone: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={authGateForm.email}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, email: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Password (8+ characters)"
                        value={authGateForm.password}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, password: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="Confirm Password"
                        value={authGateForm.confirmPassword}
                        onChange={(e) => setAuthGateForm({ ...authGateForm, confirmPassword: e.target.value })}
                        style={{ padding: "10px 12px", border: "1px solid var(--line, #ddd)", borderRadius: 4, fontSize: 13 }}
                      />
                      <button
                        type="submit"
                        disabled={authGateLoading}
                        style={{
                          padding: "11px 18px",
                          background: "var(--purple, #240e35)",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          cursor: authGateLoading ? "wait" : "pointer",
                        }}
                      >
                        {authGateLoading ? "Creating account…" : "Create Account & Continue →"}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", background: "#f8f5fc", border: "1px solid #e7def2", borderRadius: 6, marginBottom: 24 }}>
                  <span style={{ fontSize: 13, color: "var(--purple, #240e35)" }}>
                    ✓ Logged in as <b>{currentUser.name}</b> ({currentUser.email})
                  </span>
                  <Link href="/account" style={{ fontSize: 11.5, color: "var(--purple, #240e35)", fontWeight: 600, textDecoration: "underline" }}>
                    Account
                  </Link>
                </div>
              )}

              <div className="checkout-form-block">
                <h2>1. Contact details</h2>
                {field("fullName", "Full name", "Meera Shah")}
                <div className="checkout-field-row">{field("email", "Email", "you@example.com", "email")}{field("phone", "Phone", "+91 98765 43210", "tel")}</div>
              </div>

              <div className="checkout-form-block">
                <h2>2. Shipping address</h2>

                {savedAddresses.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", display: "block", marginBottom: 8 }}>
                      Select from your saved addresses:
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                      {savedAddresses.map((addr) => {
                        const isSelected = shipping.address === addr.address && shipping.pincode === addr.pincode;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setShipping((prev) => ({
                                ...prev,
                                fullName: addr.fullName || prev.fullName,
                                phone: addr.phone || prev.phone,
                                address: addr.address,
                                city: addr.city,
                                state: addr.state,
                                pincode: addr.pincode,
                              }));
                            }}
                            style={{
                              padding: "10px 14px",
                              border: isSelected ? "2px solid #2A0F3A" : "1px solid #E2E8F0",
                              borderRadius: 6,
                              background: isSelected ? "#FAF5FF" : "#FFFFFF",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: 12,
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <b style={{ color: "#2A0F3A" }}>{addr.label || "Address"}</b>
                              {addr.isDefault && (
                                <span style={{ fontSize: 9, background: "#D4AF37", color: "#1E1638", padding: "1px 5px", borderRadius: 3, fontWeight: 800 }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p style={{ margin: "2px 0", color: "#475569", lineHeight: 1.3, fontSize: 11.5 }}>
                              {addr.address}
                            </p>
                            <p style={{ margin: "2px 0 0", color: "#64748B", fontSize: 11 }}>
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {field("address", "Address", "Flat no, building, street")}
                <div style={{ marginTop: 12, marginBottom: 12 }}>
                  <LocationSelector
                    stateValue={shipping.state}
                    cityValue={shipping.city}
                    onChange={({ state, city }) => {
                      setShipping((s) => ({ ...s, state, city }));
                      if (errors.state) setErrors((e) => ({ ...e, state: undefined }));
                      if (errors.city) setErrors((e) => ({ ...e, city: undefined }));
                    }}
                  />
                  {errors.state && <em style={{ fontSize: 11, color: "#c62828", display: "block", marginTop: 4 }}>{errors.state}</em>}
                  {errors.city && <em style={{ fontSize: 11, color: "#c62828", display: "block", marginTop: 4 }}>{errors.city}</em>}
                </div>
                {field("pincode", "PIN code", "400001", "text", "checkout-pincode")}
                {pincodeStatus && (
                  <div style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: pincodeStatus.serviceable ? "#e9f7e9" : "#fde8e8",
                    color: pincodeStatus.serviceable ? "#2e7d32" : "#b34141",
                    border: `1px solid ${pincodeStatus.serviceable ? "#c3e6cb" : "#f8b4b4"}`,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span>{pincodeStatus.serviceable ? "✓" : "✕"}</span>
                    <span>{pincodeStatus.message}</span>
                  </div>
                )}
              </div>

              {/* 3. DOCTOR'S PRESCRIPTION (OPTIONAL) */}
              <div className="checkout-form-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <h2>3. Doctor&apos;s Prescription <span style={{ fontSize: 13, fontWeight: 500, color: "#64748B" }}>(Optional)</span></h2>
                  <span style={{ fontSize: 11, background: "#F1F5F9", color: "#475569", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>CLINICAL CARE</span>
                </div>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Have a doctor&apos;s prescription? Attach it below for our pharmacist team to review with your order.
                </p>

                {prescriptionKey ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>📋</span>
                      <div>
                        <b style={{ fontSize: 13, color: "#166534" }}>{prescriptionName}</b>
                        <p style={{ margin: 0, fontSize: 11, color: "#15803D" }}>✓ Attached securely to this order</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removePrescription}
                      style={{ background: "transparent", border: "none", color: "#DC2626", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      Remove ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <label
                      style={{
                        display: "block",
                        border: "2px dashed #CBD5E1",
                        borderRadius: 6,
                        padding: "16px 20px",
                        textAlign: "center",
                        background: "#F8FAFC",
                        cursor: prescriptionUploading ? "wait" : "pointer",
                        transition: "all .15s ease",
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        disabled={prescriptionUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePrescriptionUpload(f);
                        }}
                        style={{ display: "none" }}
                      />
                      <div style={{ fontSize: 24, marginBottom: 4 }}>📎</div>
                      <b style={{ fontSize: 13, color: "#1E1638" }}>
                        {prescriptionUploading ? "Uploading & validating document..." : "Click to Upload Prescription"}
                      </b>
                      <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#64748B" }}>
                        Supports PDF, JPG, PNG up to 10MB · Encrypted in non-public clinical directory
                      </p>
                    </label>
                    {prescriptionError && (
                      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#DC2626", fontWeight: 600 }}>
                        ⚠️ {prescriptionError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* DONATION (if enabled by admin) */}
              {donationConfig?.enabled && (
                <div className="checkout-form-block" style={{ background: "#fdf8f0", border: "1px solid #e8d5b5", borderRadius: 8, padding: 20 }}>
                  <h2 style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold, #b8860b)", borderBottom: "none", marginBottom: 4 }}>
                    💝 {donationConfig.title}
                  </h2>
                  <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 12px", lineHeight: 1.5 }}>
                    {donationConfig.description} {donationConfig.causeName && <>({donationConfig.causeName})</>}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                    {(donationConfig.presetAmounts || []).map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => { setDonationAmount(amt); setDonationSelectedPreset(amt); setDonationCustomInput(""); }}
                        style={{
                          padding: "8px 16px", border: donationSelectedPreset === amt ? "2px solid var(--purple)" : "1px solid #ccc",
                          background: donationSelectedPreset === amt ? "#f3edf8" : "#fff", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, borderRadius: 4,
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                  {donationConfig.customAmountEnabled && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--muted)" }}>Custom:</span>
                      <input
                        type="number"
                        placeholder={`₹${donationConfig.customMin}–₹${donationConfig.customMax.toLocaleString("en-IN")}`}
                        value={donationCustomInput}
                        onChange={(e) => {
                          setDonationCustomInput(e.target.value);
                          const v = Number(e.target.value);
                          if (v >= donationConfig.customMin && v <= donationConfig.customMax) {
                            setDonationAmount(v);
                            setDonationSelectedPreset(null);
                          } else {
                            setDonationAmount(0);
                          }
                        }}
                        min={donationConfig.customMin}
                        max={donationConfig.customMax}
                        style={{ width: 140, padding: "8px 12px", border: "1px solid #ccc", fontSize: 13, borderRadius: 4 }}
                      />
                    </div>
                  )}
                  {donationAmount > 0 && (
                    <p style={{ fontSize: 12, color: "var(--purple)", fontWeight: 600, marginTop: 10 }}>
                      ✓ Donation of {inr(donationAmount)} will be added to your order.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDonationAmount(0); setDonationSelectedPreset(null); setDonationCustomInput(""); }}
                    style={{ fontSize: 11, color: "var(--muted)", background: "none", border: "none", cursor: "pointer", marginTop: 6, textDecoration: "underline" }}
                  >
                    No thanks, skip donation
                  </button>
                </div>
              )}

              {/* PAYMENT METHOD SELECTION */}
              <div className="checkout-form-block">
                <h2>4. Payment method</h2>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {gateways.length > 0 ? (
                    gateways.map((gw) => (
                      <label
                        key={gw.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          padding: "14px 16px",
                          background: selectedGateway === gw.provider ? "#fbf9f5" : "#fff",
                          border: selectedGateway === gw.provider ? "2px solid var(--purple)" : "1px solid var(--line)",
                          cursor: "pointer",
                          transition: "all .15s ease",
                        }}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={gw.provider}
                          checked={selectedGateway === gw.provider}
                          onChange={() => setSelectedGateway(gw.provider)}
                          style={{ marginTop: 3, cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{gw.icon || "💳"}</span>
                              <b style={{ fontSize: 14 }}>{gw.displayName}</b>
                            </div>
                            {gw.codCharge ? (
                              <span style={{ fontSize: 11, color: "var(--muted)" }}>+₹{gw.codCharge} fee</span>
                            ) : null}
                          </div>
                          {gw.description && (
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
                              {gw.description}
                            </p>
                          )}
                          {!gw.isConfigured && gw.provider !== "cod" && (
                            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b8860b" }}>
                              ⚙️ Test mode (Configure credentials in Admin → Payments)
                            </p>
                          )}
                        </div>
                      </label>
                    ))
                  ) : (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, border: "1px solid var(--purple)", background: "#fbf9f5" }}>
                      <input type="radio" checked readOnly />
                      <div>
                        <b>Cash on Delivery (COD)</b>
                        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Pay at doorstep with Cash or UPI</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {notice && <p className="checkout-notice" role="alert">{notice}</p>}
              <button className="button checkout-submit" onClick={placeOrder} disabled={status === "loading"}>
                {status === "loading"
                  ? "Placing your order…"
                  : !currentUser
                  ? "Sign In to Place Order"
                  : selectedGateway === "cod"
                  ? `Place COD order · ${inr(total)}`
                  : `Pay securely · ${inr(total)}`}
              </button>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 8,
                  marginTop: 14,
                  padding: "12px",
                  background: "#F8FAFC",
                  borderRadius: 6,
                  border: "1px solid #E2E8F0",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: "#475569" }}>
                  <span style={{ fontSize: 13, display: "block", marginBottom: 2 }}>🔒</span>
                  <b>256-Bit SSL</b>
                  <span style={{ display: "block", color: "#64748B", fontSize: 10 }}>Bank-Grade Security</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  <span style={{ fontSize: 13, display: "block", marginBottom: 2 }}>🛡️</span>
                  <b>Transparent Billing</b>
                  <span style={{ display: "block", color: "#64748B", fontSize: 10 }}>GST Invoice Included</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  <span style={{ fontSize: 13, display: "block", marginBottom: 2 }}>📄</span>
                  <b>Tax Invoice</b>
                  <span style={{ display: "block", color: "#64748B", fontSize: 10 }}>Statutory GST</span>
                </div>
              </div>

              {showOrderReview && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(18, 7, 26, 0.75)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                  <div style={{ background: "#fff", borderRadius: 12, maxWidth: 520, width: "100%", padding: 24, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                      <h3 style={{ margin: 0, fontSize: 18, color: "#2A0F3A", fontWeight: 700 }}>Confirm Your Queens Care Order</h3>
                      <button onClick={() => setShowOrderReview(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748B" }}>✕</button>
                    </div>

                    <div style={{ marginBottom: 16, background: "#faf8f5", padding: 14, borderRadius: 8, border: "1px solid #eee7dd" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8E693E", marginBottom: 6 }}>Delivery Address</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{shipping.fullName}</div>
                      <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>{shipping.address}, {shipping.city}, {shipping.state} — {shipping.pincode}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Phone: <b>{shipping.phone}</b> | Email: <b>{shipping.email}</b></div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#475569" }}>
                        <span>Payment Gateway:</span>
                        <b style={{ color: "#2A0F3A" }}>{currentGateway.displayName || selectedGateway.toUpperCase()}</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6, color: "#475569" }}>
                        <span>Items:</span>
                        <b>{items.reduce((sum, it) => sum + it.quantity, 0)} formulation(s)</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, marginTop: 12, paddingTop: 10, borderTop: "1px solid #f1f5f9", fontWeight: 700, color: "#2A0F3A" }}>
                        <span>Total Payable:</span>
                        <span>{inr(total)}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                      <button
                        onClick={() => setShowOrderReview(false)}
                        style={{ flex: 1, padding: "12px 16px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, color: "#334155", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
                      >
                        Modify Details
                      </button>
                      <button
                        onClick={executePlaceOrder}
                        style={{ flex: 2, padding: "12px 16px", background: "#2A0F3A", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
                      >
                        {selectedGateway === "cod" ? "Confirm & Place COD Order" : "Proceed to Secure Payment"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {items.length ? (
            <div className="checkout-items">{items.map((it) => (
              <div key={it.slug} className="checkout-item">
                <Image src={it.image || "/placeholder.png"} alt={it.name} width={56} height={56} />
                <div><b>{it.name}</b><span>Qty {it.quantity}</span></div>
                <em>{inr(it.price * it.quantity)}</em>
              </div>
            ))}</div>
          ) : !catalogLoaded ? (
            <p className="checkout-empty">Verifying cart items…</p>
          ) : <p className="checkout-empty">Your care bag is empty. <Link href="/">Shop now</Link>.</p>}
          <div className="checkout-totals">
            <div><span>Subtotal</span><b>{inr(subtotal)}</b></div>
            {couponDiscount > 0 && <div><span>Discount</span><b style={{ color: "#2e7d32" }}>-{inr(couponDiscount)}</b></div>}
            <div><span>Shipping</span><b>{serverShipping === 0 ? "Free" : inr(serverShipping)}</b></div>
            {shippingFee > 0 && !serverBreakdown && <p className="checkout-shipping-hint">Add {inr(freeThreshold - eligibleSubtotal)} more for free shipping.</p>}
            {serverCodFee > 0 && <div><span>COD Handling Fee</span><b>{inr(serverCodFee)}</b></div>}
            {serverGst > 0 && (
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "4px 0", borderBottom: "1px solid #f0ebe5" }}>
                <span>Tax (GST)</span>
                <span style={{ float: "right" }}>
                  {serverIgst > 0 && `IGST ${inr(serverIgst)}`}
                  {serverCgst > 0 && `CGST ${inr(serverCgst)} + SGST ${inr(serverSgst)}`}
                </span>
              </div>
            )}
            {serverOtherCharges > 0 && <div><span>Other Charges</span><b>{inr(serverOtherCharges)}</b></div>}
            <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code" style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }} />
              {couponDiscount > 0 ? (
                <button onClick={removeCoupon} style={{ padding: "8px 12px", border: "1px solid #b34141", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11 }}>Remove</button>
              ) : (
                <button onClick={applyCoupon} disabled={couponLoading} style={{ padding: "8px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 11 }}>{couponLoading ? "…" : "Apply"}</button>
              )}
            </div>
            {couponMessage && <p style={{ fontSize: 11, color: couponDiscount > 0 ? "#2e7d32" : "#b34141", margin: "0 0 8px" }}>{couponMessage}</p>}
            {serverDonation > 0 && <div><span>{donationConfig?.label || "Donation"}</span><b style={{ color: "var(--purple, #240e35)" }}>+{inr(serverDonation)}</b></div>}
            {serverRoundOff !== 0 && <div><span>Round Off</span><b>{serverRoundOff > 0 ? `+${inr(serverRoundOff)}` : inr(serverRoundOff)}</b></div>}
            <div className="checkout-total"><span>Total</span><b>{inr(total > 0 ? total : 0)}</b></div>
          </div>
        </aside>
      </div>
    </main>
    <QueensCareFooter />
  </>
);
}
