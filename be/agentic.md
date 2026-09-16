YouthFashion — Agentic Project Context

This document is the main context file for AI coding agents working on the YouthFashion project.
Read this file before creating, modifying, reviewing, or explaining project code.

1. Project Overview

YouthFashion is a single-vendor fashion e-commerce website. It is a student software engineering project intended to be completed by a team of five people in approximately nine weeks.

The website sells fashion products such as:

T-shirts

Shirts

Pants

Dresses

Hoodies

Jackets

Other fashion products

The main differentiator is AI-powered multimodal product search, inspired by image-search features commonly found in modern e-commerce platforms.

The system supports:

Normal text product search.

Image-based product search.

Image plus text search.

Similar-product search when an exact product is unavailable.

Shopping cart and checkout.

Email verification before payment/order completion.

PayOS payment.

Customer chat with a Manager.

Manager and Admin dashboards.

AI search configuration for Admin users.

This is not a marketplace. There is only one shop/business owner.

2. Project Scope

2.1 Included

Customer registration and login.

Employee login.

JWT access-token authentication.

Refresh-token authentication.

Email verification.

Password reset.

Product browsing.

Product filtering and sorting.

Category and brand browsing.

Product details.

Product variants by color and size.

Multiple product images.

Cart management.

Guest checkout.

Customer checkout.

Order creation and tracking.

PayOS payment.

Payment retry before the deadline.

Email notifications.

Customer-to-Manager chat.

Employee management.

AI search configuration.

Website configuration.

Statistical reports.

AI search using text, image, or image plus text.

2.2 Explicitly excluded

Do not introduce these features unless the project owner explicitly requests them:

Marketplace or multiple sellers.

Supplier management.

Warehouse management.

Coupon system.

Discount campaign system.

Loyalty points.

Complex recommendation engine.

Product review/rating system.

AI chatbot.

AI search history.

Training an AI model from scratch.

Separate Python/FastAPI AI service.

Complex shipping-provider integration.

Separate Address entity/table.

Separate Report entity/table.

Separate Guest account table.

Keep the implementation suitable for a student project with a limited timeline.

3. User Roles

3.1 Guest

A guest is an unauthenticated visitor.

Allowed actions:

Browse products.

Search products.

Use AI product search.

View product details.

Add products to a temporary frontend cart.

Checkout as a guest.

Create an order without creating an account.

Guest orders use:

orders.customer_id = NULL

A Guest is a business concept, not necessarily a database record.

3.2 Customer

A Customer is a registered shopper.

Allowed actions:

All Guest actions.

Manage profile.

Change password.

Maintain a persistent cart.

Create orders.

View order history.

View order details.

Pay for orders.

Retry payment before the deadline.

Contact a Manager through chat.

3.3 Manager

A Manager is an employee who handles shop operations.

Allowed actions:

Manage products.

Manage product images and variants.

Manage categories.

Manage brands.

View and update orders.

Chat with customers.

View statistical reports.

A Manager cannot configure AI search or manage employees unless the project owner explicitly changes the permission model.

3.4 Admin

Admin is the highest-level role.

Admin inherits all Manager capabilities and additionally can:

Manage employees.

Activate/deactivate employees.

Assign employee roles.

Configure AI search.

Configure website information.

View statistical reports.

In UML, Admin generalizes Manager:

Admin ─────▷ Manager

The hollow triangle points toward Manager.

4. Technology Stack

Frontend

React

JavaScript

React Router

Axios

Context API, Redux, or another lightweight state solution

CSS framework or component library chosen by the team

Backend

Node.js

Express

JavaScript

Layered architecture

Prisma ORM

MySQL or PostgreSQL

AI

@huggingface/transformers

Marqo/marqo-fashionCLIP

Qdrant vector database

External services

PayOS for payment.

Cloudinary for image storage.

Nodemailer or another email provider for email notifications.

Authentication

JWT access token.

Refresh token stored in an HTTP-only cookie.

Password hashing with bcrypt.

Do not create a Python backend or FastAPI service. AI inference must run inside the Node.js backend as an internal module.

5. High-Level Architecture

React + JavaScript
        |
        | HTTP/JSON, multipart/form-data
        v
Node.js + Express + JavaScript
        |
        +--> Controllers
        |
        +--> Services
        |
        +--> Repositories / Prisma
        |
        +--> Authentication and authorization
        |
        +--> AI Search Module
        |       |
        |       +--> Transformers.js
        |       +--> FashionCLIP
        |       +--> Qdrant
        |
        +--> PayOS
        |
        +--> Email Service
        |
        +--> Cloudinary
        |
        v
MySQL/PostgreSQL

Important architectural rule

The following are internal backend components, not external actors:

Controllers

Services

Repositories

Prisma

Transformers.js

FashionCLIP

Qdrant

Internal modules

External systems include:

PayOS

Email provider

Cloudinary

6. Backend Layer Responsibilities

Controller

Responsibilities:

Read request parameters/body/files.

Call the appropriate service.

Return the correct HTTP status.

Return a consistent response format.

Do not contain complex business logic.

Service

Responsibilities:

Business rules.

Permission checks when appropriate.

Transaction orchestration.

Stock validation.

Order and payment rules.

AI search orchestration.

Repository

Responsibilities:

Prisma queries.

Database persistence.

Database filtering and pagination.

Do not put HTTP response logic inside repositories.

Validation

Validate:

Request body.

Query parameters.

Route parameters.

Uploaded files.

Enum values.

Email format.

Phone format.

Quantity and price constraints.

Middleware

Possible middleware:

Authentication.

Role authorization.

Error handling.

Request logging.

File upload.

Rate limiting for sensitive endpoints.

7. Database Model

The current relational database design contains 19 tables.

7.1 Core tables

employees

customers

categories

brands

products

product_images

product_variants

carts

cart_items

orders

order_items

payments

conversations

messages

refresh_tokens

email_verification_tokens

password_reset_tokens

ai_search_configs

website_configs

7.2 Product rules

One category has many products.

One brand has many products.

One product has many images.

One product has one or more variants.

A variant contains:

SKU

Color

Size

Price

Stock quantity

Status

SKU must be unique.

A product may have multiple images.

One image can be marked as the primary image.

7.3 Cart rules

A registered Customer has at most one persistent cart.

A cart has many cart items.

A cart item references one product variant.

The same variant should not appear twice in the same cart.

Guest cart may be stored in frontend localStorage.

Guest cart does not require a database Customer record.

7.4 Order rules

Shipping information is stored directly in the order:

Customer name

Customer phone

Customer email

Shipping address

Do not create a separate addresses table for the current scope.

An order contains:

Order code.

Optional customer ID.

Snapshot of customer/shipping information.

Order items.

Total amount.

Payment deadline.

Order status.

Timestamps.

Order item should store snapshot values such as:

Product name.

Color.

Size.

Unit price.

Quantity.

Subtotal.

This prevents old orders from changing when product information changes later.

7.5 Payment rules

One order can have many payment records.

Reason:

The first payment may fail.

The customer can retry.

Each retry creates a new payment attempt.

Suggested order statuses:

PENDING_PAYMENT
PAID
PAYMENT_FAILED
CANCELLED
COMPLETED

Suggested payment statuses:

PENDING
PAID
FAILED
EXPIRED

7.6 Conversation rules

One conversation contains:

One Customer.

One Manager.

Many messages.

A message belongs to:

One conversation.

One sender.

The sender can be the Customer or the Manager.

7.7 Configuration rules

ai_search_configs and website_configs are singleton-style configuration tables.

Normally the application should update the current row instead of inserting unlimited rows.

Recommended behavior:

config_id = 1

The database foreign key updated_by references an employee.

8. Payment Deadline Behavior

The payment countdown is five minutes.

When an order is created

Set payment_deadline = current_time + 5 minutes.

The order status is PENDING_PAYMENT.

The first payment record is created when the customer starts payment.

When payment fails

Keep the order active if the deadline has not passed.

Set the current payment to FAILED.

Allow the customer to retry.

Create a new payment record.

Do not reset the original deadline.

When the deadline expires

Set order status to CANCELLED.

Set pending payment status to EXPIRED.

Do not allow another payment attempt for that order.

PayOS callback

Only accept successful payment callbacks when:

The order exists.

The payment exists.

The order is still payable.

The deadline has not passed.

The callback signature is valid.

The payment has not already been processed.

Update payment and order status in one database transaction.

9. AI Product Search

9.1 Search modes

The endpoint supports:

Text only.

Image only.

Image plus text.

Endpoint:

POST /api/ai-search

Content Java:

multipart/form-data

Fields:

image: optional image file.

query: optional text query.

top_k: optional number.

At least one of image or query is required.

9.2 Text search flow

Vietnamese text query
        ↓
Optional controlled vocabulary mapping
        ↓
FashionCLIP text embedding
        ↓
Qdrant similarity search
        ↓
Product IDs and variant IDs
        ↓
SQL product details
        ↓
Frontend results

9.3 Image search flow

Uploaded image
        ↓
FashionCLIP image embedding
        ↓
Qdrant similarity search
        ↓
Product IDs and variant IDs
        ↓
SQL product details
        ↓
Frontend results

9.4 Image plus text flow

Calculate a combined score:

final_score =
    image_score * image_weight
    + text_score * text_weight

Suggested default values:

image_weight = 0.6
text_weight = 0.4
top_k = 20
similarity_threshold = configurable

The values must be stored in ai_search_configs and editable by Admin.

9.5 Qdrant payload

Qdrant vectors should contain payload similar to:

{
  "product_id": 1,
  "variant_id": 10
}

Business information remains in SQL. Qdrant is used for vector retrieval, not as the main business database.

9.6 Alternative products

If exact-looking products are unavailable:

Return lower-similarity products.

Mark them as alternatives.

Keep the most relevant products first.

Do not claim that an alternative is an exact match.

10. API Conventions

Success response

{
  "status": true,
  "message": "Success",
  "data": {}
}

Error response

{
  "status": false,
  "message": "Validation failed",
  "errors": []
}

HTTP status conventions

200: successful read/update.

201: resource created.

400: invalid request.

401: unauthenticated.

403: insufficient permission.

404: resource not found.

409: duplicate/conflict.

422: business validation error.

500: unexpected server error.

Naming conventions

Use consistent naming:

Database: snake_case.

JavaScript variables/functions: camelCase.

JavaScript Javas/classes: PascalCase.

API routes: plural resource names where suitable.

IDs: explicit names such as product_id, order_id, variant_id.

Do not randomly mix naming styles within the same module.

11. Main API Groups

Authentication

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/verify-email
POST /api/auth/forgot-password
POST /api/auth/reset-password

Customer

GET   /api/customers/me
PATCH /api/customers/me

Products

GET    /api/products
GET    /api/products/:product_id
POST   /api/products
PUT    /api/products/:product_id
DELETE /api/products/:product_id

Write operations require Manager or Admin.

Categories

GET    /api/categories
POST   /api/categories
PUT    /api/categories/:category_id
DELETE /api/categories/:category_id

Brands

GET    /api/brands
POST   /api/brands
PUT    /api/brands/:brand_id
DELETE /api/brands/:brand_id

Cart

GET    /api/cart
POST   /api/cart/items
PATCH  /api/cart/items/:cart_item_id
DELETE /api/cart/items/:cart_item_id

Orders

POST /api/orders
GET  /api/orders
GET  /api/orders/:order_id
POST /api/orders/:order_id/cancel

Payments

POST /api/orders/:order_id/payments
POST /api/payments/payos/webhook

AI search

POST /api/ai-search

Chat

GET  /api/conversations
POST /api/conversations
GET  /api/conversations/:conversation_id/messages
POST /api/conversations/:conversation_id/messages

Admin

GET   /api/admin/employees
POST  /api/admin/employees
GET   /api/admin/employees/:employee_id
PATCH /api/admin/employees/:employee_id
PATCH /api/admin/employees/:employee_id/status

GET   /api/admin/ai-config
PATCH /api/admin/ai-config

GET   /api/admin/website-config
PATCH /api/admin/website-config

Reports

GET /api/reports/statistics

12. Frontend Rules

Main pages

Home.

Login.

Register.

Forgot password.

Reset password.

Product list.

Product detail.

AI search.

Cart.

Checkout.

Payment result.

Order list.

Order detail.

Profile.

Customer chat.

Manager dashboard.

Admin dashboard.

Employee management.

AI configuration.

Website configuration.

Statistical reports.

Axios

Use one shared Axios instance:

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true
});

The frontend should:

Attach the access token.

Refresh the access token after a 401 response.

Retry the original request only once.

Clear auth state if refresh fails.

Avoid infinite refresh loops.

Checkout countdown

The frontend countdown must use the server-provided payment_deadline.

Do not calculate the deadline only from browser time.

Do not reset the countdown after a failed payment retry.

Guest cart

Guest cart may be stored in localStorage.

After login, the frontend may merge the guest cart into the customer's persistent cart, but this is optional if it increases project complexity.

13. Security Rules

Never:

Store plain-text passwords.

Return password hashes in API responses.

Store raw refresh tokens when a hash is sufficient.

Trust role values sent by the frontend.

Trust prices sent by the frontend.

Trust stock quantities sent by the frontend.

Accept PayOS callbacks without signature verification.

Allow a customer to access another customer's order.

Allow a Manager to access Admin-only configuration endpoints.

Put secrets in committed source code.

Always:

Validate input.

Check ownership.

Recalculate order totals on the backend.

Check stock on the backend.

Use environment variables for secrets.

Use transactions for payment/order state changes.

Sanitize uploaded files and validate file size/Java.

14. AI Agent Working Rules

When modifying the project, an AI coding agent must follow these rules:

Read this agentic.md first.

Inspect the existing code before creating new files.

Reuse existing naming conventions and folder structure.

Do not introduce a new framework without approval.

Do not create a Python service.

Do not create unnecessary database tables.

Do not add excluded features.

Keep controllers thin.

Put business logic in services.

Put database access in repositories or Prisma services.

Validate all external input.

Return consistent API responses.

Update the relevant Markdown API document when an endpoint changes.

Update the Postman collection when an endpoint, body, or route changes.

Keep frontend and backend Javas synchronized.

Explain assumptions when requirements are ambiguous.

Prefer a small working implementation over an over-engineered solution.

Preserve backward compatibility unless a breaking change is explicitly approved.

Do not silently change database relationships.

Do not claim that an endpoint works unless it has been checked against the actual code.

15. Definition of Done

A feature is complete only when:

The route exists.

Validation exists.

Authorization is correct.

Service logic is implemented.

Database access works.

Error cases are handled.

The response follows the project format.

The frontend can call the endpoint if the feature is user-facing.

The related Markdown documentation is updated.

The related Postman request is updated.

The feature does not violate the project scope.

16. Important Assumptions

Unless the project owner says otherwise:

The project is single-vendor.

Admin inherits Manager permissions.

Guest is not stored as a customer record.

Guest orders have a null customer ID.

Shipping address is stored directly in orders.

Products use variants for color and size.

Products can have multiple images.

There is no coupon/discount feature.

There is no AI search history.

One order can have multiple payment attempts.

Payment deadline is five minutes.

Failed payment retries do not reset the deadline.

AI is implemented inside Node.js.

Qdrant is not part of the relational ERD.

Reports are calculated from transactional tables.

ai_search_configs and website_configs are singleton-style tables.