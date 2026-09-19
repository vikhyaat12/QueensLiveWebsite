"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PremiumAuthPanel, { AuthFormData } from "./PremiumAuthPanel";
import MyTicketsPanel from "./MyTicketsPanel";
import LocationSelector from "@/app/components/LocationSelector";
import { addToCart } from "@/lib/client-cart";

type Tab = "profile" | "orders" | "tickets" | "addresses" | "wishlist" | "settings";
type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

type WishlistProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock?: number;
  brand?: string;
  shortDescription?: string;
};

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

export default function CustomerDashboard({ initialTab }: { initialTab?: Tab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab || "profile");
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingPhone, setEditingPhone] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    isDefault: false,
  });

  /* ── Auth State (preserves PremiumAuthPanel completely) ── */
  const [authTab, setAuthTab] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState<AuthFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    rememberMe: true,
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const router = useRouter();

  const loadUserData = async () => {
    try {
      const me = await req("/api/auth/me");
      if (me.user) {
        setUser(me.user);
        setEditingName(me.user.name || "");
        setEditingPhone(me.user.phone || "");

        const ord = await req("/api/orders");
        if (ord.orders) setOrders(ord.orders);

        const addr = await req("/api/addresses");
        if (addr.addresses) setAddresses(addr.addresses);

        loadWishlist();
      }
    } catch {}
  };

  const loadWishlist = async () => {
    setWishlistLoading(true);
    try {
      const wl = await req("/api/wishlist");
      if (wl.items) setWishlistItems(wl.items);
    } catch {}
    setWishlistLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadUserData();
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    await req("/api/auth/logout", { method: "POST" });
    location.reload();
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    setMessage("");
    try {
      const res = await req("/api/account", {
        method: "PATCH",
        body: JSON.stringify({ name: editingName, phone: editingPhone }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully.");
        if (res.user) setUser(res.user);
      } else {
        setMessage(res.error || "Failed to update profile.");
      }
    } catch {
      setMessage("Error saving profile.");
    }
    setProfileSaving(false);
  };

  const saveAddress = async () => {
    if (!addrForm.fullName || !addrForm.address || !addrForm.city || !addrForm.state || !addrForm.pincode) {
      setMessage("Please fill all required address fields.");
      return;
    }
    setAddrSaving(true);
    try {
      const res = await req("/api/addresses", { method: "POST", body: JSON.stringify(addrForm) });
      if (res.address) {
        const addr = await req("/api/addresses");
        if (addr.addresses) setAddresses(addr.addresses);
        setShowAddressForm(false);
        setAddrForm({
          label: "Home",
          fullName: "",
          phone: "",
          address: "",
          city: "",
          state: "Maharashtra",
          pincode: "",
          isDefault: false,
        });
        setMessage("Address saved.");
      } else {
        setMessage(res.error || "Failed to save address.");
      }
    } catch {
      setMessage("Error saving address.");
    }
    setAddrSaving(false);
  };

  const deleteAddress = async (id: string) => {
    try {
      await req(`/api/addresses/${id}`, { method: "DELETE" });
      setAddresses(addresses.filter((a) => a.id !== id));
      setMessage("Address removed.");
    } catch {
      setMessage("Failed to delete address.");
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      const res = await req("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({ productId, action: "remove" }),
      });
      if (res.items) {
        setWishlistItems(res.items);
      } else {
        setWishlistItems((prev) => prev.filter((p) => p.id !== productId && p.slug !== productId));
      }
      setMessage("Item removed from wishlist.");
    } catch {
      setMessage("Could not update wishlist.");
    }
  };

  const moveWishlistToCart = async (product: WishlistProduct) => {
    try {
      addToCart({ productId: product.slug || product.id, quantity: 1 });
      await removeFromWishlist(product.id);
      setMessage(`Moved "${product.name}" to your cart.`);
    } catch {
      setMessage("Failed to move item to cart.");
    }
  };

  const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  /* ── Auth handlers ── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const r = await req("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: authForm.email,
        password: authForm.password,
        rememberMe: authForm.rememberMe !== false,
      }),
    });
    if (r.error) {
      setAuthMessage(r.error);
      setAuthLoading(false);
    } else {
      setAuthSuccess(true);
      router.refresh();
      const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
      setTimeout(() => {
        if (redirect && redirect.startsWith("/")) {
          router.push(redirect);
        } else if (r.user) {
          setUser(r.user);
          loadUserData();
        }
      }, 850);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const r = await req("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: authForm.name,
        email: authForm.email,
        phone: authForm.phone,
        password: authForm.password,
        confirmPassword: authForm.confirmPassword,
      }),
    });
    if (r.error) {
      setAuthMessage(r.error);
      setAuthLoading(false);
    } else {
      setAuthSuccess(true);
      router.refresh();
      const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;
      setTimeout(() => {
        if (redirect && redirect.startsWith("/")) {
          router.push(redirect);
        } else if (r.user) {
          setUser(r.user);
          loadUserData();
        }
      }, 850);
    }
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage("");
    const r = await req("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: authForm.email }),
    });
    setAuthMessage(r.resetUrl || r.message || "Check your email.");
    setAuthLoading(false);
  };

  const queryError = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") : null;

  if (!user && !loading) {
    return (
      <PremiumAuthPanel
        authTab={authTab}
        setAuthTab={setAuthTab}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authMessage={authMessage}
        authLoading={authLoading}
        forgotMode={forgotMode}
        setForgotMode={setForgotMode}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleForgot={handleForgot}
        queryError={queryError}
        authSuccess={authSuccess}
      />
    );
  }

  const tabs: [Tab, string, string][] = [
    ["profile", "Profile", "👤"],
    ["orders", "Orders", "📦"],
    ["tickets", "Support Tickets", "🎫"],
    ["addresses", "Addresses", "📍"],
    ["wishlist", `Wishlist${wishlistItems.length > 0 ? ` (${wishlistItems.length})` : ""}`, "♡"],
    ["settings", "Settings", "⚙️"],
  ];

  return (
    <>
      <style>{`
        .qc-dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          min-height: 100vh;
          background: #faf9f6;
        }
        .qc-dashboard-nav {
          display: flex;
          flex-direction: column;
          background: #fff;
          border-bottom: 1px solid var(--line, #e6e4ea);
        }
        .qc-dashboard-header {
          padding: 20px 20px 16px;
          border-bottom: 1px solid var(--line, #e6e4ea);
        }
        .qc-dashboard-tabs-container {
          display: flex;
          flex-direction: row;
          overflow-x: auto;
          white-space: nowrap;
          padding: 8px 0;
          -webkit-overflow-scrolling: touch;
        }
        .qc-dashboard-tab {
          width: auto;
          flex: 0 0 auto;
          border-left: none !important;
          border-bottom: 4px solid transparent;
        }
        .qc-dashboard-tab.active {
          border-bottom: 4px solid var(--gold, #d4af37);
        }
        .qc-dashboard-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--line, #e6e4ea);
        }
        .qc-dashboard-content {
          padding: 20px;
          overflow-y: auto;
        }
        @media (min-width: 768px) {
          .qc-dashboard-grid {
            grid-template-columns: 240px 1fr;
          }
          .qc-dashboard-nav {
            border-right: 1px solid var(--line, #e6e4ea);
            border-bottom: none;
            padding: 28px 0 0 0;
          }
          .qc-dashboard-header {
            padding: 0 20px 24px;
          }
          .qc-dashboard-tabs-container {
            flex-direction: column;
            overflow-x: visible;
            white-space: normal;
            padding: 16px 0;
            flex: 1;
          }
          .qc-dashboard-tab {
            width: 100%;
            border-bottom: none !important;
            border-left: 4px solid transparent !important;
          }
          .qc-dashboard-tab.active {
            border-left: 4px solid var(--gold, #d4af37) !important;
          }
          .qc-dashboard-content {
            padding: 36px 44px;
          }
        }
      `}</style>
      <main className="portal qc-dashboard-grid">
        {/* Customer Sidebar Navigation */}
        <nav className="qc-dashboard-nav">
          <div className="qc-dashboard-header">
            <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
              Queens Care {String(user?.role || "customer").toUpperCase()}
            </span>
            <p style={{ font: "18px var(--font-display, serif)", margin: "4px 0 2px", color: "var(--purple, #240e35)", fontWeight: 600 }}>
              {String(user?.name || "Valued Customer")}
            </p>
            <span style={{ fontSize: 11, color: "var(--muted, #666)", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
              {String(user?.email || "")}
            </span>
          </div>

          <div className="qc-dashboard-tabs-container">
            {tabs.map(([id, label, icon]) => (
              <button
                key={id}
                className={`qc-dashboard-tab ${tab === id ? 'active' : ''}`}
                onClick={() => {
                  setTab(id);
                  setMessage("");
                  if (id === "wishlist") loadWishlist();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 20px",
                  border: "none",
                  background: tab === id ? "#f4edf8" : "transparent",
                  color: tab === id ? "var(--purple, #240e35)" : "var(--ink, #333)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: tab === id ? 700 : 500,
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="qc-dashboard-footer">
            <Link
              href="/#collection"
              style={{
                display: "block",
                fontSize: 12,
                color: "var(--purple, #240e35)",
                textDecoration: "none",
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              Browse Products →
            </Link>
            <button
              onClick={handleLogout}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 0",
                border: "none",
                background: "transparent",
                color: "#b34141",
                cursor: "pointer",
                fontSize: 12,
                textAlign: "left",
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="qc-dashboard-content">
        {message && (
          <div
            style={{
              padding: "12px 18px",
              background: message.includes("Error") || message.includes("Failed") ? "#ffebee" : "#e8f5e9",
              border: `1px solid ${message.includes("Error") || message.includes("Failed") ? "#ffcdd2" : "#c8e6c9"}`,
              borderRadius: 6,
              fontSize: 13,
              color: message.includes("Error") || message.includes("Failed") ? "#c62828" : "#2e7d32",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>{message}</span>
            <button
              onClick={() => setMessage("")}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "inherit" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── PROFILE TAB ─── */}
        {tab === "profile" && user && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                Personal Information
              </span>
              <h2 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 0", color: "var(--purple, #240e35)" }}>
                Your Profile
              </h2>
            </div>

            <div
              style={{
                background: "#fff",
                border: "1px solid var(--line, #e6e4ea)",
                borderRadius: 8,
                padding: 28,
                maxWidth: 580,
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                display: "grid",
                gap: 18,
              }}
            >
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--ink, #333)" }}>
                  Full Name
                </label>
                <input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  style={{ padding: "11px 14px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, width: "100%", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--ink, #333)" }}>
                  Email Address (Account Identifier)
                </label>
                <input
                  value={String(user.email || "")}
                  readOnly
                  style={{
                    padding: "11px 14px",
                    border: "1px solid var(--line, #e6e4ea)",
                    borderRadius: 4,
                    width: "100%",
                    fontSize: 14,
                    background: "#f7f7f9",
                    color: "var(--muted, #666)",
                    cursor: "not-allowed",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--muted, #888)", marginTop: 4, display: "block" }}>
                  Email is locked for account security.
                </span>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--ink, #333)" }}>
                  Phone Number
                </label>
                <input
                  value={editingPhone}
                  onChange={(e) => setEditingPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ padding: "11px 14px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, width: "100%", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--ink, #333)" }}>
                    Account Type
                  </label>
                  <input
                    value={String(user.role || "customer").toUpperCase()}
                    readOnly
                    style={{
                      padding: "11px 14px",
                      border: "1px solid var(--line, #e6e4ea)",
                      borderRadius: 4,
                      width: "100%",
                      fontSize: 13,
                      background: "#f7f7f9",
                      fontWeight: 600,
                      color: "var(--purple, #240e35)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6, color: "var(--ink, #333)" }}>
                    Member Since
                  </label>
                  <input
                    value={user.createdAt ? new Date(String(user.createdAt)).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
                    readOnly
                    style={{
                      padding: "11px 14px",
                      border: "1px solid var(--line, #e6e4ea)",
                      borderRadius: 4,
                      width: "100%",
                      fontSize: 13,
                      background: "#f7f7f9",
                    }}
                  />
                </div>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  style={{
                    padding: "12px 24px",
                    background: "var(--purple, #240e35)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    cursor: profileSaving ? "wait" : "pointer",
                    opacity: profileSaving ? 0.7 : 1,
                  }}
                >
                  {profileSaving ? "Saving…" : "Save Changes →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {tab === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                  Order History
                </span>
                <h2 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 0", color: "var(--purple, #240e35)" }}>
                  Your Orders
                </h2>
              </div>
              <Link
                href="/account/orders"
                style={{
                  fontSize: 12,
                  color: "var(--purple, #240e35)",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                View Full Orders Page ↗
              </Link>
            </div>

            {orders.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line, #e6e4ea)",
                  borderRadius: 8,
                  padding: "50px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>🛍️</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--purple, #240e35)", margin: "0 0 6px" }}>
                  No orders placed yet
                </p>
                <p style={{ color: "var(--muted, #666)", fontSize: 13, marginBottom: 20 }}>
                  Explore our luxury cosmeceuticals and wellness formulations.
                </p>
                <Link
                  href="/#collection"
                  style={{
                    padding: "10px 20px",
                    background: "var(--purple, #240e35)",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Start Shopping →
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 14 }}>
                {orders.map((o) => (
                  <div
                    key={String(o.id)}
                    style={{
                      padding: "18px 24px",
                      background: "#fff",
                      border: "1px solid var(--line, #e6e4ea)",
                      borderRadius: 8,
                      display: "grid",
                      gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
                      gap: 16,
                      alignItems: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div>
                      <b style={{ fontFamily: "monospace", fontSize: 13, color: "var(--purple, #240e35)" }}>
                        #{String(o.id).slice(0, 16)}
                      </b>
                      <p style={{ fontSize: 11, color: "var(--muted, #666)", margin: "4px 0 0" }}>
                        {new Date(String(o.createdAt)).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          fontSize: 10,
                          textTransform: "uppercase",
                          fontWeight: 700,
                          borderRadius: 20,
                          background: o.status === "delivered" ? "#e8f5e9" : o.status === "cancelled" || o.status === "rejected" ? "#ffebee" : "#fff8e1",
                          color: o.status === "delivered" ? "#2e7d32" : o.status === "cancelled" || o.status === "rejected" ? "#c62828" : "#b78103",
                          border: `1px solid ${o.status === "delivered" ? "#c8e6c9" : o.status === "cancelled" || o.status === "rejected" ? "#ffcdd2" : "#ffe082"}`,
                        }}
                      >
                        {String(o.status || "pending").replace(/_/g, " ")}
                      </span>
                    </div>

                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          fontSize: 10,
                          textTransform: "uppercase",
                          fontWeight: 600,
                          borderRadius: 20,
                          background: o.paymentStatus === "paid" ? "#e8f5e9" : "#f5f5f5",
                          color: o.paymentStatus === "paid" ? "#2e7d32" : "#555",
                        }}
                      >
                        {String(o.paymentStatus || "pending")}
                      </span>
                    </div>

                    <div>
                      <span style={{ font: "16px var(--font-display, serif)", fontWeight: 700, color: "var(--purple, #240e35)" }}>
                        {inr(Number(o.total))}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <Link
                        href={`/account/orders/${encodeURIComponent(String(o.id))}`}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 4,
                          background: "#fff",
                          border: "1px solid var(--line, #e6e4ea)",
                          color: "var(--purple, #240e35)",
                          textDecoration: "none",
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Details →
                      </Link>
                      <Link
                        href={`/account/orders/${encodeURIComponent(String(o.id))}/invoice`}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 4,
                          background: "var(--purple, #240e35)",
                          color: "#fff",
                          textDecoration: "none",
                          fontSize: 11,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>📄</span> Invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── ADDRESSES TAB ─── */}
        {tab === "tickets" && <MyTicketsPanel />}

        {tab === "addresses" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                  Shipping & Delivery
                </span>
                <h2 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 0", color: "var(--purple, #240e35)" }}>
                  Saved Addresses
                </h2>
              </div>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                style={{
                  padding: "10px 18px",
                  background: showAddressForm ? "#fff" : "var(--purple, #240e35)",
                  color: showAddressForm ? "var(--ink, #333)" : "#fff",
                  border: showAddressForm ? "1px solid #ccc" : "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {showAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </div>

            {/* Address Form with Cascading Location Dropdown */}
            {showAddressForm && (
              <div
                style={{
                  padding: 24,
                  background: "#fff",
                  border: "1px solid var(--line, #e6e4ea)",
                  borderRadius: 8,
                  marginBottom: 24,
                  display: "grid",
                  gap: 16,
                  maxWidth: 620,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                }}
              >
                <h3 style={{ font: "18px var(--font-display, serif)", margin: "0 0 6px", color: "var(--purple, #240e35)" }}>
                  Add Shipping Address
                </h3>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Label</label>
                    <select
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                    >
                      <option>Home</option>
                      <option>Office</option>
                      <option>Clinic / Hospital</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Full Name *</label>
                    <input
                      value={addrForm.fullName}
                      onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                      placeholder="e.g. Dr. Priya Patel"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Contact Phone *</label>
                  <input
                    value={addrForm.phone}
                    onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Street Address *</label>
                  <input
                    value={addrForm.address}
                    onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                    placeholder="Flat / Floor, Building Name, Street, Landmark"
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                {/* Controlled State -> City Cascading Selector */}
                <LocationSelector
                  stateValue={addrForm.state}
                  cityValue={addrForm.city}
                  onChange={({ state, city }) => setAddrForm((prev) => ({ ...prev, state, city }))}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "center" }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>PIN Code *</label>
                    <input
                      value={addrForm.pincode}
                      onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })}
                      placeholder="6-digit postal code"
                      maxLength={6}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 18 }}>
                    <input
                      type="checkbox"
                      id="isDefaultAddr"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      style={{ width: 16, height: 16 }}
                    />
                    <label htmlFor="isDefaultAddr" style={{ fontSize: 12, cursor: "pointer", color: "var(--ink, #333)" }}>
                      Set as default address
                    </label>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
                  <button
                    onClick={saveAddress}
                    disabled={addrSaving}
                    style={{
                      padding: "11px 20px",
                      background: "var(--purple, #240e35)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 4,
                      cursor: addrSaving ? "wait" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {addrSaving ? "Saving Address…" : "Save Address →"}
                  </button>
                  <button
                    onClick={() => setShowAddressForm(false)}
                    style={{
                      padding: "11px 18px",
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {addresses.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line, #e6e4ea)",
                  borderRadius: 8,
                  padding: "50px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>📍</span>
                <p style={{ fontSize: 15, fontWeight: 600, color: "var(--purple, #240e35)", margin: "0 0 6px" }}>
                  No saved addresses
                </p>
                <p style={{ color: "var(--muted, #666)", fontSize: 13, marginBottom: 16 }}>
                  Save your home or clinic address for seamless one-click checkout.
                </p>
                <button
                  onClick={() => setShowAddressForm(true)}
                  style={{
                    padding: "9px 18px",
                    background: "var(--purple, #240e35)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add Address
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: 20,
                      background: "#fff",
                      border: `1px solid ${a.isDefault ? "var(--gold, #d4af37)" : "var(--line, #e6e4ea)"}`,
                      borderRadius: 8,
                      position: "relative",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                    }}
                  >
                    {a.isDefault && (
                      <span
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          background: "var(--gold, #d4af37)",
                          color: "#fff",
                          borderRadius: 4,
                          textTransform: "uppercase",
                        }}
                      >
                        Default
                      </span>
                    )}
                    <b style={{ fontSize: 14, color: "var(--purple, #240e35)", display: "block", marginBottom: 6 }}>
                      {a.label}
                    </b>
                    <p style={{ fontSize: 13, color: "var(--ink, #333)", margin: "4px 0", lineHeight: 1.5 }}>
                      <b>{a.fullName}</b>
                      <br />
                      {a.address}
                      <br />
                      {a.city}, {a.state} {a.pincode}
                      <br />
                      <span style={{ color: "var(--muted, #666)", fontSize: 12 }}>Phone: {a.phone}</span>
                    </p>
                    <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
                      <button
                        onClick={() => deleteAddress(a.id)}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#b34141",
                          fontSize: 12,
                          cursor: "pointer",
                          padding: 0,
                          fontWeight: 600,
                        }}
                      >
                        Remove Address
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── WISHLIST TAB (LIVE PERSISTENCE) ─── */}
        {tab === "wishlist" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                  Saved Formulations
                </span>
                <h2 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 0", color: "var(--purple, #240e35)" }}>
                  Your Wishlist {wishlistItems.length > 0 && `(${wishlistItems.length})`}
                </h2>
              </div>
              <Link
                href="/#collection"
                style={{
                  padding: "9px 16px",
                  background: "var(--purple, #240e35)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Browse Collection →
              </Link>
            </div>

            {wishlistLoading ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--muted, #666)" }}>
                <p>Loading your saved wishlist…</p>
              </div>
            ) : wishlistItems.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--line, #e6e4ea)",
                  borderRadius: 8,
                  padding: "60px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>♡</span>
                <h3 style={{ font: "20px var(--font-display, serif)", margin: "0 0 8px", color: "var(--purple, #240e35)" }}>
                  Your wishlist is empty
                </h3>
                <p style={{ color: "var(--muted, #666)", fontSize: 13, maxWidth: 420, margin: "0 auto 20px" }}>
                  Explore our luxury cosmeceuticals and save your favorite formulations for later.
                </p>
                <Link
                  href="/#collection"
                  style={{
                    padding: "10px 22px",
                    background: "var(--purple, #240e35)",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Explore Collection
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                {wishlistItems.map((prod) => {
                  const inStock = prod.stock === undefined || prod.stock > 0;
                  return (
                    <div
                      key={prod.id}
                      style={{
                        background: "#fff",
                        border: "1px solid var(--line, #e6e4ea)",
                        borderRadius: 8,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ height: 180, position: "relative", background: "#f8f7fa" }}>
                        <Image
                          src={prod.image || "/uploads/logos/queens-care-official-original.png"}
                          alt={prod.name}
                          fill
                          style={{ objectFit: "contain", padding: 16 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 12,
                            background: inStock ? "#e8f5e9" : "#ffebee",
                            color: inStock ? "#2e7d32" : "#c62828",
                            border: `1px solid ${inStock ? "#c8e6c9" : "#ffcdd2"}`,
                          }}
                        >
                          {inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>

                      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                            {prod.brand || "Queens Care"}
                          </span>
                          <h4 style={{ font: "15px var(--font-display, serif)", margin: "4px 0 8px", color: "var(--purple, #240e35)" }}>
                            {prod.name}
                          </h4>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--purple, #240e35)" }}>
                            {inr(prod.price)}
                          </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginTop: 16 }}>
                          <button
                            onClick={() => moveWishlistToCart(prod)}
                            disabled={!inStock}
                            style={{
                              padding: "9px 12px",
                              background: inStock ? "var(--purple, #240e35)" : "#ccc",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: inStock ? "pointer" : "not-allowed",
                            }}
                          >
                            Move to Cart
                          </button>

                          <button
                            onClick={() => removeFromWishlist(prod.id)}
                            style={{
                              padding: "9px 12px",
                              background: "#fff",
                              border: "1px solid #ddd",
                              borderRadius: 4,
                              fontSize: 12,
                              color: "#b34141",
                              cursor: "pointer",
                            }}
                            title="Remove from wishlist"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── SETTINGS TAB ─── */}
        {tab === "settings" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--gold, #b8860b)", fontWeight: 700 }}>
                Preferences & Security
              </span>
              <h2 style={{ font: "28px var(--font-display, serif)", margin: "4px 0 0", color: "var(--purple, #240e35)" }}>
                Account Settings
              </h2>
            </div>

            <div style={{ display: "grid", gap: 18, maxWidth: 600 }}>
              <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line, #e6e4ea)", borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "var(--purple, #240e35)" }}>
                  Change Password
                </h4>
                <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: "0 0 14px", lineHeight: 1.5 }}>
                  Update your password. Changing your password requires your current password and will invalidate prior sessions across other devices.
                </p>

                {passwordMessage && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 4,
                      fontSize: 12,
                      marginBottom: 12,
                      background: passwordMessage.includes("success") ? "#e8f5e9" : "#ffebee",
                      color: passwordMessage.includes("success") ? "#2e7d32" : "#c62828",
                      border: `1px solid ${passwordMessage.includes("success") ? "#c8e6c9" : "#ffcdd2"}`,
                    }}
                  >
                    {passwordMessage}
                  </div>
                )}

                <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
                  <input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{ padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                  />
                  <input
                    type="password"
                    placeholder="New password (8+ characters)"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{ padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    style={{ padding: "10px 12px", border: "1px solid var(--line, #e6e4ea)", borderRadius: 4, fontSize: 13 }}
                  />
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
                    <button
                      onClick={async () => {
                        setPasswordSaving(true);
                        setPasswordMessage("");
                        const res = await req("/api/auth/change-password", {
                          method: "POST",
                          body: JSON.stringify(passwordForm),
                        });
                        if (res.ok) {
                          setPasswordMessage("Password updated successfully.");
                          setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                        } else {
                          setPasswordMessage(res.error || "Failed to update password.");
                        }
                        setPasswordSaving(false);
                      }}
                      disabled={passwordSaving}
                      style={{
                        padding: "10px 18px",
                        background: "var(--purple, #240e35)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: passwordSaving ? "wait" : "pointer",
                      }}
                    >
                      {passwordSaving ? "Updating…" : "Update Password"}
                    </button>

                    <button
                      onClick={async () => {
                        if (user?.email) {
                          await req("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email: user.email }) });
                          setMessage("Password reset link generated. Check your email.");
                        }
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--purple, #240e35)",
                        fontSize: 12,
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line, #e6e4ea)", borderRadius: 8 }}>
                <h4 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "var(--purple, #240e35)" }}>
                  Customer Support & Assistance
                </h4>
                <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: "0 0 12px", lineHeight: 1.5 }}>
                  Have questions regarding your orders, formulation usage, or prescriptions? Reach our healthcare pharmacist team.
                </p>
                <p style={{ fontSize: 12, color: "var(--ink, #333)", margin: 0 }}>
                  Email: <b>care@queenscare.in</b> | Toll-Free: <b>+91 1800 123 7833</b>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
