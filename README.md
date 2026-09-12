# IyanjuWorld

**A modern multi-vendor marketplace connecting customers, businesses, and delivery riders through one trusted commerce platform.**

IyanjuWorld is a scalable digital marketplace designed to make it easy for customers to discover products, place orders, make secure payments, communicate with businesses, and receive products through verified delivery riders.

Businesses can create storefronts, manage products and inventory, receive orders, communicate with customers, and manage their earnings from one platform.

---

## 1. Vision

IyanjuWorld aims to provide a trusted digital marketplace where customers, businesses, and delivery riders can interact through a single, secure, and convenient platform.

The platform is designed around three core principles:

- **Discover** — Customers can discover products and businesses easily.
- **Buy** — Customers can order products and pay securely.
- **Deliver** — Verified riders can handle delivery from business to customer.

The long-term goal is to build a marketplace capable of supporting businesses of different sizes, multiple product categories, local delivery, digital payments, customer wallets, messaging, and scalable marketplace operations.

---

## 2. Core Features

### Marketplace

- Public product discovery
- Product categories
- Product search
- Product filtering
- Product details
- Business storefronts
- Product images
- Product pricing
- Product availability
- Stock management
- Product discounts
- Business verification badges
- SEO-friendly public pages

### Customers

Customers can:

- Create an account
- Browse products without signing in
- Search products
- View businesses
- Add products to cart
- Place orders
- Select delivery locations
- Pay for orders
- Use their marketplace wallet
- Add money to their wallet
- Request wallet withdrawals
- Track orders
- Cancel eligible orders
- Receive refunds
- Chat with businesses
- Chat with assigned riders
- Receive notifications
- Review completed purchases

### Businesses

Business owners can:

- Register their business
- Create a storefront
- Submit business information for verification
- Add products
- Upload product images
- Set prices
- Set stock quantities
- Manage product availability
- Manage orders
- Communicate with customers
- View sales
- View earnings
- Track payouts
- Manage business settings

### Riders

Verified riders can:

- Register as delivery riders
- Submit verification information
- Add vehicle information
- Set operating areas
- Set availability
- Receive eligible delivery requests
- Accept deliveries
- View pickup information
- Complete deliveries
- Communicate with customers
- View delivery history
- View rider earnings
- Track payouts

### Payments

The platform is designed to support Flutterwave payment methods available for Nigerian Naira transactions, including applicable methods such as:

- Card
- Bank Transfer
- Account/Direct Bank Account
- USSD
- OPay
- NQR
- eNaira
- Internet Banking where available

Payment availability may depend on the currency, transaction configuration, Flutterwave account, and payment method availability.

All payments use a unified payment flow with server-side verification and webhook processing.

### Customer Wallet

Every registered customer can have a marketplace wallet.

Wallet functionality includes:

- Add money
- Pay for marketplace orders
- Receive refunds
- View wallet transactions
- Request withdrawals
- Track pending wallet activity

Wallet balances are maintained using ledger-based accounting rather than simple frontend balance calculations.

### Delivery

The platform supports:

- Delivery fee configuration
- Delivery areas
- Rider availability
- Delivery requests
- Rider assignment
- Pickup tracking
- Delivery tracking
- Customer confirmation
- Rider earnings
- Delivery history

Only verified and eligible riders should receive delivery requests.

### Messaging

The platform supports in-platform communication between:

- Customers and businesses
- Customers and riders
- Businesses and administrators

The messaging architecture is designed to support future conversation types without requiring a complete redesign.

### Security

Security is a core part of the architecture.

The platform uses:

- Supabase Authentication
- PostgreSQL Row Level Security
- Server-side authorization
- Role-based access control
- Secure payment verification
- Webhook verification
- Payment idempotency
- Wallet transaction idempotency
- Audit logging
- Server-side validation
- Protected administrative operations

---

# 3. Business Model

IyanjuWorld uses a simple marketplace commission model.

### Customer

The customer pays:

**Product subtotal + delivery fee**

The customer does **not** pay a separate platform or service fee.

### Business

The business pays:

**5% platform commission on the product/order subtotal**

The delivery fee is not included in the platform commission by default.

### Example

Product subtotal:

**₦20,000**

Delivery fee:

**₦2,000**

Customer pays:

**₦22,000**

Platform commission:

**₦1,000**

Business earnings:

**₦19,000**

The exact settlement and payout rules are controlled by the platform's financial architecture.

---

# 4. Order Lifecycle

A typical order follows this flow:

```text
Customer discovers product
        ↓
Adds product to cart
        ↓
Checkout
        ↓
Select delivery location
        ↓
Calculate product + delivery total
        ↓
Select payment method
        ↓
Payment
        ↓
Server-side payment verification
        ↓
Order marked as paid
        ↓
Business receives order
        ↓
Business confirms order
        ↓
Delivery request created
        ↓
Eligible riders notified
        ↓
Rider accepts delivery
        ↓
Rider picks up order
        ↓
Order out for delivery
        ↓
Customer receives order
        ↓
Customer confirms delivery
        ↓
Order completed
        ↓
Earnings become eligible for settlement
