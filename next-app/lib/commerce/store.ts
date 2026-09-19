import "server-only";
import { randomUUID, randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fileDb } from "./file-db";
import type { AuthUser, B2BApplication, BlogPost, CartLine, ContactMessage, Notification, Order, PaymentStatus, Product, Review, ShippingDetails, SiteContent, User } from "./types";

type OrderLineInput = CartLine & { unitPrice?: number };
const now = () => new Date().toISOString();

const usePrisma = Boolean(process.env.DATABASE_URL);

export const store = {
	products: {
		list: async (): Promise<Product[]> => {
			if (usePrisma) {
				try {
					return (await prisma.product.findMany({ where: { active: true } })) as unknown as Product[];
				} catch {}
			}
			const items = fileDb.findMany("products", p => p.active !== false);
			return items as unknown as Product[];
		},
		all: async (): Promise<Product[]> => {
			if (usePrisma) {
				try {
					const products = await prisma.product.findMany();
					return products as unknown as Product[];
				} catch {}
			}
			const items = fileDb.findMany("products");
			return items as unknown as Product[];
		},
		bySlug: async (slug: string): Promise<Product | null> => {
			if (usePrisma) {
				try {
					const product = await prisma.product.findFirst({
						where: { OR: [{ slug }, { id: slug }] }
					});
					if (product) return product as unknown as Product;
				} catch {}
			}
			const item = fileDb.findOne("products", (p) => p.slug === slug || p.id === slug);
			return item as unknown as Product | null;
		},
		save: async (input: Partial<Product> & { slug?: string }): Promise<Product> => {
			if (usePrisma) {
				try {
					const up = await prisma.product.upsert({
						where: { slug: String(input.slug) },
						update: input as unknown as Prisma.ProductUpdateInput,
						create: input as unknown as Prisma.ProductCreateInput
					});
					// Also mirror to fileDb
					fileDb.update("products", { id: up.id, slug: up.slug }, up as unknown as Record<string, unknown>);
					return up as unknown as Product;
				} catch {}
			}
			const id = input.id || (input.slug ? fileDb.findOne("products", p => p.slug === input.slug)?.id : undefined) || `p-${Date.now().toString(36)}`;
			const slug = input.slug || (input.id ? fileDb.findOne("products", p => p.id === input.id)?.slug : undefined) || String(input.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
			const existing = (fileDb.findOne("products", (p) => p.id === id || p.slug === slug) || {}) as Record<string, unknown>;
			const item = {
				id,
				slug,
				name: existing.name || input.name || "",
				brand: existing.brand || input.brand || "Queens Care",
				description: existing.description || input.description || "",
				shortDescription: existing.shortDescription || input.shortDescription || "",
				category: existing.category || input.category || "General",
				price: Number(input.price !== undefined ? input.price : (existing.price || 0)),
				mrp: input.mrp !== undefined ? Number(input.mrp) : (existing.mrp ? Number(existing.mrp) : undefined),
				discount: input.discount !== undefined ? Number(input.discount) : (existing.discount ? Number(existing.discount) : undefined),
				stock: Number(input.stock !== undefined ? input.stock : (existing.stock || 0)),
				lowStockThreshold: Number(input.lowStockThreshold !== undefined ? input.lowStockThreshold : (existing.lowStockThreshold || 10)),
				image: input.image || existing.image || "",
				images: input.images || existing.images || (input.image ? [input.image] : []),
				thumbnail: input.thumbnail || existing.thumbnail || input.image || existing.image,
				video: input.video !== undefined ? input.video : existing.video,
				active: input.active !== undefined ? input.active : (existing.active !== false),
				visible: input.visible !== undefined ? input.visible : (existing.visible !== false),
				featured: input.featured !== undefined ? Boolean(input.featured) : Boolean(existing.featured),
				homepageVisible: input.homepageVisible !== undefined ? Boolean(input.homepageVisible) : Boolean(existing.homepageVisible),
				benefits: input.benefits || existing.benefits,
				ingredients: input.ingredients || existing.ingredients,
				usage: input.usage || existing.usage,
				safetyInfo: input.safetyInfo || existing.safetyInfo,
				tags: input.tags || existing.tags,
				searchKeywords: input.searchKeywords || existing.searchKeywords,
				seoTitle: input.seoTitle || existing.seoTitle,
				seoDescription: input.seoDescription || existing.seoDescription,
				altText: input.altText || existing.altText,
				rating: input.rating !== undefined ? input.rating : (existing.rating ?? 5.0),
				reviewCount: input.reviewCount !== undefined ? input.reviewCount : (existing.reviewCount ?? 0),
				createdAt: existing.createdAt || input.createdAt || now(),
				...existing,
				...input,
				updatedAt: now(),
			};
			const updated = fileDb.update("products", { id: String(id), slug: String(slug) }, item as Record<string, unknown>);
			return updated as unknown as Product;
		},
		delete: async (idOrSlug: string): Promise<boolean> => {
			if (usePrisma) {
				try {
					await prisma.product.delete({ where: { id: idOrSlug } });
					fileDb.remove("products", idOrSlug);
					return true;
				} catch {
					try {
						await prisma.product.delete({ where: { slug: idOrSlug } });
						fileDb.remove("products", idOrSlug);
						return true;
					} catch {}
				}
			}
			const removed = fileDb.remove("products", idOrSlug);
			return Boolean(removed);
		},
		decrementStock: async (slugOrId: string, quantity: number): Promise<boolean> => {
			if (usePrisma) {
				try {
					const updated = await prisma.product.updateMany({
						where: { OR: [{ slug: slugOrId }, { id: slugOrId }], stock: { gte: quantity } },
						data: { stock: { decrement: quantity } }
					});
					if (updated.count > 0) return true;
				} catch {}
			}
			const p = fileDb.findOne("products", (x) => x.slug === slugOrId || x.id === slugOrId);
			if (!p || Number(p.stock || 0) < quantity) return false;
			const newStock = Number(p.stock) - quantity;
			fileDb.update("products", { id: String(p.id), slug: String(p.slug) }, { stock: newStock });
			return true;
		},
	},
	users: {
		hasAny: async (): Promise<boolean> => {
			if (usePrisma) {
				try { return (await prisma.user.count()) > 0; } catch {}
			}
			return fileDb.collection("users").length > 0;
		},
		list: async (query?: { search?: string; status?: string; role?: string }): Promise<AuthUser[]> => {
			if (usePrisma) {
				try {
					const where: Prisma.UserWhereInput = {};
					if (query?.role) where.role = query.role as Prisma.EnumRoleFilter;
					if (query?.status === "active") where.isActive = true;
					else if (query?.status === "disabled" || query?.status === "deactivated") where.isActive = false;
					if (query?.search) {
						where.OR = [
							{ name: { contains: query.search, mode: "insensitive" } },
							{ email: { contains: query.search, mode: "insensitive" } },
							{ phone: { contains: query.search, mode: "insensitive" } },
						];
					}
					const users = await prisma.user.findMany({ where, orderBy: { createdAt: "desc" } });
					return users as unknown as AuthUser[];
				} catch {}
			}
			const all = (fileDb.collection("users") || []) as unknown as AuthUser[];
			return all.filter((u) => {
				if (query?.role && u.role !== query.role) return false;
				const currentStatus = u.status || (u.isActive === false ? "disabled" : "active");
				if (query?.status && currentStatus !== query.status) return false;
				if (query?.search) {
					const s = query.search.toLowerCase();
					const matchName = (u.name || "").toLowerCase().includes(s);
					const matchEmail = (u.email || "").toLowerCase().includes(s);
					const matchPhone = (u.phone || "").toLowerCase().includes(s);
					const matchId = (u.id || "").toLowerCase().includes(s);
					if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
				}
				return true;
			});
		},
		findEmail: async (email: string): Promise<AuthUser | null> => {
			if (usePrisma) {
				try {
					const user = await prisma.user.findUnique({ where: { email } });
					if (user) return user as unknown as AuthUser;
				} catch {}
			}
			const item = fileDb.findOne("users", u => String(u.email).toLowerCase() === email.toLowerCase());
			return item as unknown as AuthUser | null;
		},
		byId: async (id: string): Promise<AuthUser | null> => {
			if (usePrisma) {
				try {
					const user = await prisma.user.findUnique({ where: { id } });
					if (user) return user as unknown as AuthUser;
				} catch {}
			}
			const item = fileDb.findOne("users", u => u.id === id);
			return item as unknown as AuthUser | null;
		},
		create: async (input: Partial<User> & { passwordHash: string }): Promise<AuthUser> => {
			const status = input.status || "active";
			const isActive = status !== "disabled" && status !== "deactivated";
			const tokenVersion = input.tokenVersion || 1;
			if (usePrisma) {
				try {
					const user = await prisma.user.create({
						data: {
							...input,
							phone: input.phone || null,
							isActive,
						} as unknown as Prisma.UserCreateInput
					});
					fileDb.insert("users", { ...user, status, tokenVersion } as unknown as Record<string, unknown>);
					return { ...user, status, tokenVersion } as unknown as AuthUser;
				} catch {}
			}
			const user = {
				id: input.id || `usr-${randomUUID().slice(0, 8)}`,
				email: input.email || "",
				name: input.name || "",
				phone: input.phone || "",
				role: input.role || "customer",
				status,
				isActive,
				tokenVersion,
				createdAt: now(),
				updatedAt: now(),
				...input,
			};
			fileDb.insert("users", user as Record<string, unknown>);
			return user as unknown as AuthUser;
		},
		update: async (id: string, patch: Record<string, unknown>): Promise<AuthUser | null> => {
			const sanitizedPatch = { ...patch };
			if (patch.status !== undefined) {
				sanitizedPatch.isActive = patch.status !== "disabled" && patch.status !== "deactivated";
			}
			if (usePrisma) {
				try {
					const u = await prisma.user.update({ where: { id }, data: sanitizedPatch as never });
					fileDb.update("users", id, { ...u, ...sanitizedPatch, updatedAt: now() } as unknown as Record<string, unknown>);
					return { ...u, ...sanitizedPatch } as unknown as AuthUser;
				} catch {}
			}
			const updated = fileDb.update("users", id, { ...sanitizedPatch, updatedAt: now() });
			return updated as unknown as AuthUser | null;
		},
	},
	passwordReset: {
		createToken: async (userId: string, email: string): Promise<string> => {
			const token = randomBytes(32).toString("hex");
			const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
			if (usePrisma) {
				try {
					await prisma.emailToken.deleteMany({ where: { userId, type: "reset" } });
					await prisma.emailToken.create({ data: { userId, token, type: "reset", expiresAt: new Date(expiresAt) } });
				} catch {}
			}
			const existing = fileDb.findMany("passwordResets", r => r.userId === userId || r.email === email);
			for (const r of existing) {
				if (r.id) fileDb.remove("passwordResets", String(r.id));
			}
			fileDb.insert("passwordResets", {
				id: `rst-${Date.now().toString(36)}-${randomBytes(4).toString("hex")}`,
				userId,
				email,
				token,
				expiresAt,
				used: false,
				createdAt: now(),
			});
			return token;
		},
		verifyToken: async (token: string): Promise<{ userId: string; email: string } | null> => {
			if (usePrisma) {
				try {
					const emailToken = await prisma.emailToken.findUnique({ where: { token } });
					if (emailToken && emailToken.type === "reset" && !emailToken.used && emailToken.expiresAt > new Date()) {
						const user = await prisma.user.findUnique({ where: { id: emailToken.userId } });
						return user ? { userId: user.id, email: user.email } : null;
					}
				} catch {}
			}
			const record = fileDb.findOne("passwordResets", r => r.token === token);
			if (!record) return null;
			if (record.used) return null;
			if (new Date(String(record.expiresAt)).getTime() <= Date.now()) return null;
			return { userId: String(record.userId), email: String(record.email) };
		},
		consumeToken: async (token: string): Promise<boolean> => {
			if (usePrisma) {
				try {
					await prisma.emailToken.update({ where: { token }, data: { used: true } });
				} catch {}
			}
			const record = fileDb.findOne("passwordResets", r => r.token === token);
			if (record && record.id) {
				fileDb.update("passwordResets", String(record.id), { used: true, consumedAt: now() });
				return true;
			}
			return false;
		},
	},
	orders: {
		list: async (user?: User) => {
			if (usePrisma) {
				try {
					if (!user || user.role === "admin") return (await prisma.order.findMany({ include: { lines: { include: { product: true } } }, orderBy: { createdAt: "desc" } })) as unknown as Order[];
					return (await prisma.order.findMany({ where: { userId: user.id }, include: { lines: { include: { product: true } } }, orderBy: { createdAt: "desc" } })) as unknown as Order[];
				} catch {}
			}
			const all = fileDb.findMany("orders");
			if (!user || user.role === "admin") return all as unknown as Order[];
			return all.filter((o) => o.userId === user.id) as unknown as Order[];
		},
		byId: async (id: string) => {
			if (usePrisma) {
				try {
					return (await prisma.order.findUnique({ where: { id }, include: { lines: { include: { product: true } } } })) as unknown as Order | null;
				} catch {}
			}
			const found = fileDb.findOne("orders", o => o.id === id);
			if (found) {
				const allProducts = fileDb.findMany("products");
				const rawLines = Array.isArray(found.lines) ? found.lines : [];
				const enriched = rawLines.map((l: Record<string, unknown>) => {
					const pid = String(l.productId || "");
					const p = allProducts.find((x: Record<string, unknown>) => x.id === pid || x.slug === pid);
					return {
						...l,
						product: p || {
							id: pid,
							name: String(l.name || "Queens Care Formulation"),
							image: String(l.image || "/uploads/logos/queens-care-official-original.png"),
							price: Number(l.unitPrice || 0),
							slug: pid,
						},
					};
				});
				return { ...found, lines: enriched } as unknown as Order;
			}
			return null;
		},
		create: async (userId: string, lines: OrderLineInput[], total: number, shipping?: ShippingDetails, details?: { subtotal?: number; discount?: number; shippingFee?: number; couponCode?: string; paymentMethod?: string; paymentStatus?: PaymentStatus; trackingCode?: string; courier?: string; notes?: string; prescriptionKey?: string; prescriptionFilename?: string; prescriptionStatus?: string; prescriptionNotes?: string; donationAmount?: number; invoiceNo?: string }) => {
			const trackingCode = details?.trackingCode || `QC${Math.floor(100000 + Math.random() * 899999)}`;
			const subtotal = details?.subtotal !== undefined ? details.subtotal : total;
			const discount = details?.discount || 0;
			const shippingFee = details?.shippingFee || 0;
			const paymentMethod = details?.paymentMethod || "cod";
			const paymentStatus = details?.paymentStatus || (paymentMethod === "cod" ? "cod_pending" : "pending");
			const prescriptionKey = details?.prescriptionKey;
			const prescriptionFilename = details?.prescriptionFilename;
			const prescriptionStatus = details?.prescriptionStatus || (prescriptionKey ? "submitted" : "not_submitted");
			const prescriptionNotes = details?.prescriptionNotes;

			if (usePrisma) {
				try {
					const data: Record<string, unknown> = {
						userId,
						subtotal,
						discount,
						shippingFee,
						tax: 0,
						total,
						status: "pending",
						paymentStatus,
						paymentMethod,
						couponCode: details?.couponCode,
						trackingCode,
						lines: { create: lines.map((l) => ({ product: { connect: { slug: l.productId } }, quantity: l.quantity, unitPrice: l.unitPrice ?? 0 })) }
					};
					if (shipping) data.shipping = shipping;
					const order = await prisma.order.create({ data: data as unknown as Prisma.OrderCreateInput, include: { lines: true } });
					const orderWithRx = { ...order, prescriptionKey, prescriptionFilename, prescriptionStatus, prescriptionNotes };
					fileDb.insert("orders", orderWithRx as unknown as Record<string, unknown>);
					return orderWithRx as unknown as Order;
				} catch {}
			}
			const item: Order = {
				id: `QC-${Date.now().toString(36).toUpperCase()}`,
				userId,
				lines,
				subtotal,
				discount,
				couponCode: details?.couponCode,
				shippingFee,
				tax: 0,
				total,
				status: "pending",
				paymentStatus,
				paymentMethod,
				trackingCode,
				prescriptionKey,
				prescriptionFilename,
				prescriptionStatus,
				prescriptionNotes,
				createdAt: now(),
				shipping,
				notes: details?.notes,
			};
			fileDb.insert("orders", item as unknown as Record<string, unknown>);
			return item;
		},
		update: async (id: string, patch: Partial<Order>) => {
			if (usePrisma) {
				try {
					const u = await prisma.order.update({ where: { id }, data: patch as unknown as Prisma.OrderUpdateInput });
					fileDb.update("orders", id, u as unknown as Record<string, unknown>);
					return u as unknown as Order;
				} catch {}
			}
			const updated = fileDb.update("orders", id, patch as Record<string, unknown>);
			return updated as unknown as Order | null;
		},
		findRecentDuplicate: async (userId: string, linesKey: string, total: number): Promise<Order | null> => {
			const cutoffMs = Date.now() - 10 * 60 * 1000;
			if (usePrisma) {
				try {
					const orders = (await prisma.order.findMany({
						where: { userId, status: "pending", total, createdAt: { gte: new Date(cutoffMs) } },
						include: { lines: { include: { product: true } } },
					})) as unknown as Array<{ id: string; lines: Array<{ quantity: number; product: { slug: string } }> }>;
					const hit = orders.find((o) => o.lines.map((l) => `${l.product.slug}:${l.quantity}`).sort().join("|") === linesKey);
					if (hit) return hit as unknown as Order;
				} catch {}
			}
			const all = fileDb.findMany("orders");
			const match = all.find((o) => {
				const lines = (o.lines as OrderLineInput[]) || [];
				return o.userId === userId && o.status === "pending" && Number(o.total) === total && new Date(String(o.createdAt)).getTime() >= cutoffMs && lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|") === linesKey;
			});
			return (match as unknown as Order) || null;
		},
	},
	content: {
		list: async () => {
			if (usePrisma) {
				try { return (await prisma.content.findMany()) as unknown as SiteContent[]; } catch {}
			}
			return fileDb.findMany("content") as unknown as SiteContent[];
		},
		get: async (key: string) => {
			if (usePrisma) {
				try {
					const c = await prisma.content.findUnique({ where: { key } });
					if (c) return c as unknown as SiteContent;
				} catch {}
			}
			return (fileDb.findOne("content", c => c.key === key) as unknown as SiteContent) || null;
		},
		save: async (key: string, value: unknown) => {
			if (usePrisma) {
				try {
					const c = await prisma.content.upsert({
						where: { key },
						update: { value } as Prisma.ContentUpdateInput,
						create: { key, value } as Prisma.ContentCreateInput
					});
					fileDb.update("content", { key }, c as unknown as Record<string, unknown>);
					return c as unknown as SiteContent;
				} catch {}
			}
			const record = fileDb.update("content", { key }, { key, value });
			return record as unknown as SiteContent;
		},
	},
	posts: {
		list: async (draft = false) => {
			if (usePrisma) {
				try {
					return (await prisma.blogPost.findMany({
						where: draft ? {} : { published: true, visible: true },
						orderBy: { createdAt: "desc" },
					})) as unknown as BlogPost[];
				} catch {}
			}
			const all = fileDb.findMany("blogPosts");
			const filtered = all.filter(p => draft || (p.published !== false && p.visible !== false));
			return filtered.sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()) as unknown as BlogPost[];
		},
		bySlug: async (slug: string): Promise<BlogPost | null> => {
			if (usePrisma) {
				try {
					const post = await prisma.blogPost.findUnique({ where: { slug } });
					if (post) return post as unknown as BlogPost;
				} catch {}
			}
			const found = fileDb.findOne("blogPosts", p => p.slug === slug || p.id === slug);
			return (found as unknown as BlogPost) || null;
		},
		save: async (input: Partial<BlogPost>) => {
			const id = String(input.id || (input.slug ? fileDb.findOne("blogPosts", p => p.slug === input.slug)?.id : undefined) || `bp-${Date.now().toString(36)}`);
			const slug = String(input.slug || (input.id ? fileDb.findOne("blogPosts", p => p.id === input.id)?.slug : undefined) || String(input.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
			if (usePrisma) {
				try {
					const { id: inputId, ...data } = input;
					if (inputId) {
						const existing = await prisma.blogPost.findUnique({ where: { id: inputId } });
						if (existing) {
							const up = (await prisma.blogPost.update({
								where: { id: inputId },
								data: { ...data, slug } as Prisma.BlogPostUpdateInput,
							})) as unknown as BlogPost;
							fileDb.update("blogPosts", { id: up.id, slug: up.slug }, up as unknown as Record<string, unknown>);
							return up;
						}
					}
					const up = (await prisma.blogPost.upsert({
						where: { slug },
						update: data as Prisma.BlogPostUpdateInput,
						create: { ...data, slug } as Prisma.BlogPostCreateInput,
					})) as unknown as BlogPost;
					fileDb.update("blogPosts", { id: up.id, slug: up.slug }, up as unknown as Record<string, unknown>);
					return up;
				} catch {}
			}
			const existing = (fileDb.findOne("blogPosts", (p) => p.id === id || p.slug === slug) || {}) as Record<string, unknown>;
			const record = {
				id,
				slug,
				title: input.title || existing.title || "",
				excerpt: input.excerpt || existing.excerpt || "",
				body: input.body || input.content || existing.body || existing.content || "",
				content: input.content || input.body || existing.content || existing.body || "",
				category: input.category || existing.category || "Wellness notes",
				tags: input.tags || existing.tags || "",
				author: input.author || existing.author || "Queens Care Research Team",
				readTime: input.readTime || existing.readTime || "5 min read",
				image: input.image || existing.image || "",
				images: input.images || existing.images || "",
				videoUrl: input.videoUrl !== undefined ? input.videoUrl : existing.videoUrl,
				videoTitle: input.videoTitle !== undefined ? input.videoTitle : existing.videoTitle,
				featured: input.featured !== undefined ? Boolean(input.featured) : Boolean(existing.featured),
				seoTitle: input.seoTitle || existing.seoTitle || input.title || existing.title,
				seoDescription: input.seoDescription || existing.seoDescription || input.excerpt || existing.excerpt,
				ogImage: input.ogImage || existing.ogImage || input.image || existing.image,
				published: input.published !== undefined ? Boolean(input.published) : (existing.published !== false),
				visible: input.visible !== undefined ? Boolean(input.visible) : (existing.visible !== false),
				createdAt: existing.createdAt || input.createdAt || now(),
				...existing,
				...input,
				updatedAt: now(),
			};
			if (input.content && !record.body) record.body = input.content;
			if (input.body && !record.content) record.content = input.body;
			const saved = fileDb.update("blogPosts", { id: String(id), slug: String(slug) }, record as Record<string, unknown>);
			return saved as unknown as BlogPost;
		},
		delete: async (idOrSlug: string) => {
			if (usePrisma) {
				try {
					await prisma.blogPost.delete({ where: { id: idOrSlug } });
					fileDb.remove("blogPosts", idOrSlug);
					return true;
				} catch {
					try {
						await prisma.blogPost.delete({ where: { slug: idOrSlug } });
						fileDb.remove("blogPosts", idOrSlug);
						return true;
					} catch {}
				}
			}
			const removed = fileDb.remove("blogPosts", idOrSlug);
			return Boolean(removed);
		},
	},
	contacts: {
		create: async (input: Partial<ContactMessage>) => {
			if (usePrisma) {
				try {
					const res = (await prisma.contactMessage.create({ data: input as unknown as Prisma.ContactMessageCreateInput })) as unknown as ContactMessage;
					fileDb.insert("contactEnquiries", res as unknown as Record<string, unknown>);
					return res;
				} catch {}
			}
			const record = fileDb.insert("contactEnquiries", {
				id: `QC-CNT-${Date.now().toString(36).toUpperCase()}`,
				status: "new",
				createdAt: new Date().toISOString(),
				...input,
			});
			return record as unknown as ContactMessage;
		},
	},
	applications: {
		all: async () => {
			if (usePrisma) {
				try { return (await prisma.b2BApplication.findMany({ orderBy: { createdAt: "desc" } })) as unknown as B2BApplication[]; } catch {}
			}
			return fileDb.findMany("b2bApplications") as unknown as B2BApplication[];
		},
		create: async (input: Partial<B2BApplication>) => {
			if (usePrisma) {
				try {
					const created = (await prisma.b2BApplication.create({ data: input as unknown as Prisma.B2BApplicationCreateInput })) as unknown as B2BApplication;
					fileDb.insert("b2bApplications", created as unknown as Record<string, unknown>);
					return created;
				} catch {}
			}
			const item = fileDb.insert("b2bApplications", { ...input, status: "pending" });
			return item as unknown as B2BApplication;
		},
	},
	reviews: {
		list: async (productId?: string) => {
			let idMatch = productId ? String(productId) : undefined;
			let slugMatch = productId ? String(productId) : undefined;
			if (productId) {
				const prod = fileDb.findOne("products", p => p.id === productId || p.slug === productId);
				if (prod) {
					idMatch = String(prod.id);
					slugMatch = String(prod.slug);
				}
			}
			if (usePrisma) {
				try {
					return (await prisma.review.findMany({
						where: { ...(productId ? { OR: [{ productId: idMatch }, { productId: slugMatch }] } : {}), visible: true },
						include: { user: true, product: true },
						orderBy: { createdAt: "desc" },
					})) as unknown as Review[];
				} catch {}
			}
			const all = fileDb.findMany("reviews", r => !productId || r.productId === idMatch || r.productId === slugMatch || r.productSlug === slugMatch);
			return all.filter(r => r.visible !== false) as unknown as Review[];
		},
		all: async () => {
			if (usePrisma) {
				try {
					return (await prisma.review.findMany({
						include: { user: true, product: true },
						orderBy: { createdAt: "desc" },
					})) as unknown as Review[];
				} catch {}
			}
			return fileDb.findMany("reviews") as unknown as Review[];
		},
		create: async (input: Partial<Review> & Record<string, unknown>) => {
			let prod = null;
			if (input.productId) {
				prod = fileDb.findOne("products", p => p.id === input.productId || p.slug === input.productId);
			}
			const prodId = prod?.id || input.productId;
			const prodSlug = prod?.slug || input.productSlug || input.productId;

			// Verify purchase against real orders in fileDb:
			let isVerifiedPurchase = false;
			if (input.verified !== undefined) {
				isVerifiedPurchase = Boolean(input.verified);
			} else if (input.userId || input.customerEmail) {
				try {
					const orders = fileDb.findMany("orders");
					const matchingOrder = orders.find((ord: Record<string, unknown>) => {
						const uMatch = (input.userId && ord.userId === input.userId) ||
							(input.customerEmail && (ord.shipping as Record<string, unknown>)?.email && String((ord.shipping as Record<string, unknown>).email).toLowerCase() === String(input.customerEmail).toLowerCase());
						if (!uMatch) return false;
						const lines = Array.isArray(ord.lines) ? ord.lines : [];
						return lines.some((l: Record<string, unknown>) => l.productId === prodId || l.productId === prodSlug);
					});
					if (matchingOrder) {
						isVerifiedPurchase = true;
					}
				} catch {}
			}

			if (usePrisma) {
				try {
					const r = (await prisma.review.create({ data: { ...input, verified: isVerifiedPurchase } as unknown as Prisma.ReviewCreateInput })) as unknown as Review;
					fileDb.insert("reviews", r as unknown as Record<string, unknown>);
					return r;
				} catch {}
			}
			const item = fileDb.insert("reviews", {
				id: `rev-${Date.now().toString(36)}`,
				visible: input.visible !== undefined ? Boolean(input.visible) : true,
				helpful: 0,
				verified: isVerifiedPurchase,
				createdAt: new Date().toISOString(),
				productSlug: prodSlug,
				product: prod ? { id: prod.id, name: prod.name, slug: prod.slug } : null,
				user: { name: input.customerName || input.author || "Customer" },
				...input,
			});
			return item as unknown as Review;
		},
		update: async (reviewId: string, data: Record<string, unknown>) => {
			if (usePrisma) {
				try {
					const r = await prisma.review.update({ where: { id: reviewId }, data: data as never });
					fileDb.update("reviews", reviewId, data);
					return r;
				} catch {}
			}
			return fileDb.update("reviews", reviewId, data);
		},
		updateVisibility: async (reviewId: string, visible: boolean) => {
			if (usePrisma) {
				try {
					const r = await prisma.review.update({ where: { id: reviewId }, data: { visible } });
					fileDb.update("reviews", reviewId, { visible });
					return r;
				} catch {}
			}
			return fileDb.update("reviews", reviewId, { visible });
		},
		delete: async (reviewId: string) => {
			if (usePrisma) {
				try {
					await prisma.review.delete({ where: { id: reviewId } });
					fileDb.remove("reviews", reviewId);
					return true;
				} catch {}
			}
			return Boolean(fileDb.remove("reviews", reviewId));
		},
	},
	notifications: {
		list: async (userId: string) => {
			if (usePrisma) {
				try { return (await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })) as unknown as Notification[]; } catch {}
			}
			return [];
		},
		create: async (userId: string, title: string, body: string, type = "info") => {
			if (usePrisma) {
				try { return (await prisma.notification.create({ data: { userId, title, body, type } })) as unknown as Notification; } catch {}
			}
			return { id: randomUUID(), userId, title, body, type, read: false, createdAt: now() };
		},
	},
	settings: {
		get: async (key: string) => {
			if (usePrisma) {
				try {
					const s = await prisma.setting.findUnique({ where: { key } });
					if (s) return s;
				} catch {}
			}
			return fileDb.findOne("settings", s => s.key === key);
		},
		set: async (key: string, value: unknown, group = "general") => {
			if (usePrisma) {
				try {
					const s = await prisma.setting.upsert({ where: { key }, update: { value: value as never, group }, create: { key, value: value as never, group } });
					fileDb.update("settings", { key }, { key, value, group });
					return s;
				} catch {}
			}
			return fileDb.update("settings", { key }, { key, value, group });
		},
		all: async () => {
			if (usePrisma) {
				try { return await prisma.setting.findMany({ orderBy: { group: "asc" } }); } catch {}
			}
			return fileDb.findMany("settings");
		},
	},
	wishlist: {
		get: async (userId: string): Promise<string[]> => {
			if (usePrisma) {
				try {
					const items = await prisma.wishlistItem.findMany({ where: { userId } });
					return items.map((w: { productId: string }) => w.productId);
				} catch {}
			}
			return fileDb.findMany("wishlistItems", w => w.userId === userId).map(w => String(w.productId));
		},
		getItemsWithProducts: async (userId: string): Promise<Product[]> => {
			const ids = await store.wishlist.get(userId);
			const all = await store.products.all();
			return ids
				.map(id => all.find(p => p.id === id || p.slug === id))
				.filter(Boolean) as Product[];
		},
		add: async (userId: string, productId: string): Promise<string[]> => {
			if (usePrisma) {
				try {
					const existing = await prisma.wishlistItem.findUnique({
						where: { userId_productId: { userId, productId } }
					});
					if (!existing) {
						await prisma.wishlistItem.create({ data: { userId, productId } });
					}
					const items = await prisma.wishlistItem.findMany({ where: { userId } });
					return items.map((w: { productId: string }) => w.productId);
				} catch {}
			}
			const existing = fileDb.findOne("wishlistItems", w => w.userId === userId && w.productId === productId);
			if (!existing) {
				fileDb.insert("wishlistItems", {
					id: `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
					userId,
					productId,
					createdAt: now(),
				});
			}
			return fileDb.findMany("wishlistItems", w => w.userId === userId).map(w => String(w.productId));
		},
		remove: async (userId: string, productId: string): Promise<string[]> => {
			if (usePrisma) {
				try {
					await prisma.wishlistItem.deleteMany({
						where: { userId, productId }
					});
					const items = await prisma.wishlistItem.findMany({ where: { userId } });
					return items.map((w: { productId: string }) => w.productId);
				} catch {}
			}
			const existing = fileDb.findOne("wishlistItems", w => w.userId === userId && w.productId === productId);
			if (existing) {
				fileDb.remove("wishlistItems", String(existing.id));
			}
			return fileDb.findMany("wishlistItems", w => w.userId === userId).map(w => String(w.productId));
		},
		toggle: async (userId: string, productId: string): Promise<string[]> => {
			if (usePrisma) {
				try {
					const existing = await prisma.wishlistItem.findUnique({
						where: { userId_productId: { userId, productId } }
					});
					if (existing) {
						await prisma.wishlistItem.delete({ where: { id: existing.id } });
					} else {
						await prisma.wishlistItem.create({ data: { userId, productId } });
					}
					const items = await prisma.wishlistItem.findMany({ where: { userId } });
					return items.map((w: { productId: string }) => w.productId);
				} catch {}
			}
			const existing = fileDb.findOne("wishlistItems", w => w.userId === userId && w.productId === productId);
			if (existing) {
				fileDb.remove("wishlistItems", String(existing.id));
			} else {
				fileDb.insert("wishlistItems", {
					id: `wl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
					userId,
					productId,
					createdAt: now(),
				});
			}
			return fileDb.findMany("wishlistItems", w => w.userId === userId).map(w => String(w.productId));
		},
	},
};

export default store;