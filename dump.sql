--
-- PostgreSQL database dump
--

\restrict DhyTI9DxzeM1KkjWwUtHLGA8RC2hPhlXfZw1Vp8EYqezX5kNTZMdKiH9fhVSBsS

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.brands (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category_id integer
);


--
-- Name: brands_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.brands_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: brands_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.brands_id_seq OWNED BY public.brands.id;


--
-- Name: cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart (
    id integer NOT NULL,
    user_id integer,
    product_id integer,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_id_seq OWNED BY public.cart.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    has_sizes boolean DEFAULT false,
    has_colors boolean DEFAULT false,
    has_memory boolean DEFAULT false
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id integer NOT NULL,
    code character varying(50),
    discount_percent integer,
    is_active boolean DEFAULT true,
    expires_at timestamp without time zone
);


--
-- Name: coupons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupons_id_seq OWNED BY public.coupons.id;


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id integer NOT NULL,
    user_id integer,
    product_id integer
);


--
-- Name: favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favorites_id_seq OWNED BY public.favorites.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    price numeric(10,2),
    quantity integer,
    size character varying(10),
    color character varying(20),
    memory character varying(20),
    variant_id integer
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    total numeric(10,2),
    status character varying(50) DEFAULT 'Pending'::character varying,
    shipping_method character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer,
    stripe_payment_id character varying(255),
    amount numeric(10,2),
    status character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: product_colors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_colors (
    id integer NOT NULL,
    product_id integer,
    color character varying(20)
);


--
-- Name: product_colors_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_colors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_colors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_colors_id_seq OWNED BY public.product_colors.id;


--
-- Name: product_memory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_memory (
    id integer NOT NULL,
    product_id integer,
    memory character varying(20)
);


--
-- Name: product_memory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_memory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_memory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_memory_id_seq OWNED BY public.product_memory.id;


--
-- Name: product_sizes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_sizes (
    id integer NOT NULL,
    product_id integer,
    size character varying(10)
);


--
-- Name: product_sizes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_sizes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_sizes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_sizes_id_seq OWNED BY public.product_sizes.id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id integer NOT NULL,
    product_id integer NOT NULL,
    size character varying(10),
    color character varying(20),
    memory character varying(20),
    qty integer DEFAULT 0 NOT NULL
);


--
-- Name: product_variants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_variants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: product_variants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_variants_id_seq OWNED BY public.product_variants.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(150),
    description text,
    price numeric(10,2),
    image text,
    stock integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    qty integer DEFAULT 0,
    purchase_price numeric(10,2),
    sale_price numeric(10,2),
    in_stock boolean DEFAULT true,
    tags text,
    brand_id integer,
    category_id integer,
    size character varying(20),
    color character varying(50),
    memory character varying(50)
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: store_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_settings (
    id integer NOT NULL,
    store_name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(50),
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: store_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.store_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: store_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.store_settings_id_seq OWNED BY public.store_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100),
    email character varying(150) NOT NULL,
    password character varying(255),
    google_id character varying(255),
    avatar text,
    phone character varying(30),
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    role character varying(20) DEFAULT 'user'::character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: brands id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands ALTER COLUMN id SET DEFAULT nextval('public.brands_id_seq'::regclass);


--
-- Name: cart id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart ALTER COLUMN id SET DEFAULT nextval('public.cart_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: coupons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons ALTER COLUMN id SET DEFAULT nextval('public.coupons_id_seq'::regclass);


--
-- Name: favorites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites ALTER COLUMN id SET DEFAULT nextval('public.favorites_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: product_colors id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors ALTER COLUMN id SET DEFAULT nextval('public.product_colors_id_seq'::regclass);


--
-- Name: product_memory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_memory ALTER COLUMN id SET DEFAULT nextval('public.product_memory_id_seq'::regclass);


--
-- Name: product_sizes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sizes ALTER COLUMN id SET DEFAULT nextval('public.product_sizes_id_seq'::regclass);


--
-- Name: product_variants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN id SET DEFAULT nextval('public.product_variants_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: store_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings ALTER COLUMN id SET DEFAULT nextval('public.store_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: brands; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.brands VALUES (1, 'Nike', 2);
INSERT INTO public.brands VALUES (2, 'Adidas', 2);
INSERT INTO public.brands VALUES (3, 'Apple', 3);
INSERT INTO public.brands VALUES (4, 'Samsung', 3);
INSERT INTO public.brands VALUES (9, 'sony', 3);
INSERT INTO public.brands VALUES (10, 'nike', 5);
INSERT INTO public.brands VALUES (11, 'dg', 5);


--
-- Data for Name: cart; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (3, 'Electronics', '2026-06-17 15:13:27.256848', false, true, true);
INSERT INTO public.categories VALUES (2, 'shoes', '2026-06-17 15:11:50.334687', true, false, false);
INSERT INTO public.categories VALUES (5, 'clothes', '2026-06-18 11:50:56.184547', true, false, false);


--
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.coupons VALUES (1, 'SAVE10', 10, true, '2026-12-31 23:59:59');
INSERT INTO public.coupons VALUES (2, 'WELCOME20', 20, true, '2026-12-31 23:59:59');


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items VALUES (63, 65, 47, 25.00, 5, NULL, NULL, NULL, NULL);
INSERT INTO public.order_items VALUES (64, 66, 48, 50.00, 1, NULL, NULL, NULL, NULL);
INSERT INTO public.order_items VALUES (65, 67, 48, 50.00, 1, NULL, NULL, NULL, NULL);


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES (38, 9, 250.00, 'pending', NULL, NULL, '2026-06-24 13:48:18.838598');
INSERT INTO public.orders VALUES (39, 2, 4000.00, 'pending', NULL, NULL, '2026-06-24 14:45:51.317441');
INSERT INTO public.orders VALUES (40, 2, 650.00, 'pending', NULL, NULL, '2026-06-24 14:46:07.605779');
INSERT INTO public.orders VALUES (41, 2, 25.00, 'pending', NULL, NULL, '2026-06-24 14:46:25.946248');
INSERT INTO public.orders VALUES (42, 2, 250.00, 'pending', NULL, NULL, '2026-06-24 14:46:47.860601');
INSERT INTO public.orders VALUES (43, 2, 650.00, 'delivered', NULL, NULL, '2026-06-24 14:47:45.427891');
INSERT INTO public.orders VALUES (44, 2, 50.00, 'pending', NULL, NULL, '2026-06-24 15:20:06.233623');
INSERT INTO public.orders VALUES (45, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 15:41:59.342637');
INSERT INTO public.orders VALUES (46, 2, 1200.00, 'pending', NULL, NULL, '2026-06-24 15:42:26.657665');
INSERT INTO public.orders VALUES (47, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 15:42:44.857339');
INSERT INTO public.orders VALUES (48, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 15:54:38.71157');
INSERT INTO public.orders VALUES (49, 2, 1200.00, 'pending', NULL, NULL, '2026-06-24 15:54:56.357076');
INSERT INTO public.orders VALUES (50, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 16:02:30.533391');
INSERT INTO public.orders VALUES (51, 2, 1000.00, 'pending', NULL, NULL, '2026-06-24 16:02:50.928387');
INSERT INTO public.orders VALUES (52, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 16:07:16.904931');
INSERT INTO public.orders VALUES (53, 2, 650.00, 'pending', NULL, NULL, '2026-06-24 16:07:35.051442');
INSERT INTO public.orders VALUES (54, 2, 0.00, 'pending', NULL, NULL, '2026-06-24 16:15:02.515916');
INSERT INTO public.orders VALUES (55, 2, 650.00, 'pending', NULL, NULL, '2026-06-24 16:15:16.402676');
INSERT INTO public.orders VALUES (56, 2, 650.00, 'pending', NULL, NULL, '2026-06-25 11:27:55.160547');
INSERT INTO public.orders VALUES (57, 2, 650.00, 'pending', NULL, NULL, '2026-06-25 11:33:23.836679');
INSERT INTO public.orders VALUES (58, 2, 650.00, 'pending', NULL, NULL, '2026-06-25 11:35:25.122928');
INSERT INTO public.orders VALUES (59, 2, 2400.00, 'delivered', NULL, NULL, '2026-06-25 11:36:35.59796');
INSERT INTO public.orders VALUES (60, 2, 650.00, 'delivered', NULL, NULL, '2026-06-25 11:42:49.572123');
INSERT INTO public.orders VALUES (61, 2, 1200.00, 'delivered', NULL, NULL, '2026-06-25 11:45:55.470943');
INSERT INTO public.orders VALUES (62, 2, 25.00, 'delivered', NULL, NULL, '2026-06-25 11:46:36.705826');
INSERT INTO public.orders VALUES (63, 10, 650.00, 'delivered', NULL, NULL, '2026-06-25 11:50:26.121852');
INSERT INTO public.orders VALUES (64, 2, 650.00, 'delivered', NULL, NULL, '2026-06-25 11:55:45.646023');
INSERT INTO public.orders VALUES (65, 2, 125.00, 'delivered', NULL, NULL, '2026-06-25 14:03:18.655701');
INSERT INTO public.orders VALUES (66, 2, 50.00, 'delivered', NULL, NULL, '2026-06-25 14:22:05.76599');
INSERT INTO public.orders VALUES (67, 2, 50.00, 'Pending', NULL, NULL, '2026-06-25 15:06:05.917471');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_colors; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_memory; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_sizes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.product_variants VALUES (1, 42, 'XS', NULL, NULL, 5);
INSERT INTO public.product_variants VALUES (2, 42, 'S', NULL, NULL, 10);
INSERT INTO public.product_variants VALUES (3, 42, 'M', NULL, NULL, 10);
INSERT INTO public.product_variants VALUES (4, 42, 'L', NULL, NULL, 10);
INSERT INTO public.product_variants VALUES (5, 42, 'XL', NULL, NULL, 10);
INSERT INTO public.product_variants VALUES (6, 42, 'XXL', NULL, NULL, 5);
INSERT INTO public.product_variants VALUES (7, 43, NULL, 'Blue', '64GB', 5);
INSERT INTO public.product_variants VALUES (8, 43, NULL, 'Blue', '128GB', 10);
INSERT INTO public.product_variants VALUES (9, 43, NULL, 'Blue', '256GB', 20);
INSERT INTO public.product_variants VALUES (10, 43, NULL, 'Blue', '512GB', 5);
INSERT INTO public.product_variants VALUES (11, 43, NULL, 'Blue', '1TB', 1);
INSERT INTO public.product_variants VALUES (12, 43, NULL, 'Silver', '64GB', 10);
INSERT INTO public.product_variants VALUES (13, 43, NULL, 'Silver', '128GB', 5);
INSERT INTO public.product_variants VALUES (14, 43, NULL, 'Silver', '256GB', 5);
INSERT INTO public.product_variants VALUES (15, 43, NULL, 'Silver', '512GB', 20);
INSERT INTO public.product_variants VALUES (16, 43, NULL, 'Silver', '1TB', 1);
INSERT INTO public.product_variants VALUES (17, 44, NULL, 'Blue', '128GB', 5);
INSERT INTO public.product_variants VALUES (18, 44, NULL, 'Blue', '256GB', 55);
INSERT INTO public.product_variants VALUES (19, 44, NULL, 'Blue', '512GB', 45);
INSERT INTO public.product_variants VALUES (20, 44, NULL, 'Blue', '1TB', 5);
INSERT INTO public.product_variants VALUES (21, 44, NULL, 'Silver', '128GB', 20);
INSERT INTO public.product_variants VALUES (22, 44, NULL, 'Silver', '256GB', 30);
INSERT INTO public.product_variants VALUES (23, 44, NULL, 'Silver', '512GB', 40);
INSERT INTO public.product_variants VALUES (24, 44, NULL, 'Silver', '1TB', 5);
INSERT INTO public.product_variants VALUES (25, 45, NULL, 'Blue', '64GB', 4);
INSERT INTO public.product_variants VALUES (26, 45, NULL, 'Blue', '128GB', 40);
INSERT INTO public.product_variants VALUES (27, 45, NULL, 'Blue', '256GB', 50);
INSERT INTO public.product_variants VALUES (28, 45, NULL, 'Blue', '512GB', 4);
INSERT INTO public.product_variants VALUES (29, 45, NULL, 'Blue', '1TB', 3);
INSERT INTO public.product_variants VALUES (30, 45, NULL, 'Silver', '1TB', 5);
INSERT INTO public.product_variants VALUES (31, 45, NULL, 'Silver', '512GB', 6);
INSERT INTO public.product_variants VALUES (32, 45, NULL, 'Silver', '256GB', 70);
INSERT INTO public.product_variants VALUES (33, 45, NULL, 'Silver', '128GB', 90);
INSERT INTO public.product_variants VALUES (34, 45, NULL, 'Silver', '64GB', 1);
INSERT INTO public.product_variants VALUES (35, 46, NULL, 'Blue', '64GB', 4);
INSERT INTO public.product_variants VALUES (36, 46, NULL, 'Blue', '128GB', 56);
INSERT INTO public.product_variants VALUES (37, 46, NULL, 'Blue', '256GB', 87);
INSERT INTO public.product_variants VALUES (38, 46, NULL, 'Blue', '512GB', 6);
INSERT INTO public.product_variants VALUES (39, 46, NULL, 'Blue', '1TB', 5);
INSERT INTO public.product_variants VALUES (40, 46, NULL, 'Silver', '64GB', 5);
INSERT INTO public.product_variants VALUES (41, 46, NULL, 'Silver', '128GB', 67);
INSERT INTO public.product_variants VALUES (42, 46, NULL, 'Silver', '256GB', 98);
INSERT INTO public.product_variants VALUES (43, 46, NULL, 'Silver', '512GB', 7);
INSERT INTO public.product_variants VALUES (44, 46, NULL, 'Silver', '1TB', 3);
INSERT INTO public.product_variants VALUES (45, 47, 'XS', NULL, NULL, 55);
INSERT INTO public.product_variants VALUES (46, 47, 'S', NULL, NULL, 67);
INSERT INTO public.product_variants VALUES (47, 47, 'M', NULL, NULL, 70);
INSERT INTO public.product_variants VALUES (48, 47, 'L', NULL, NULL, 59);
INSERT INTO public.product_variants VALUES (49, 47, 'XL', NULL, NULL, 45);
INSERT INTO public.product_variants VALUES (50, 47, 'XXL', NULL, NULL, 47);
INSERT INTO public.product_variants VALUES (51, 48, 'XS', NULL, NULL, 45);
INSERT INTO public.product_variants VALUES (52, 48, 'S', NULL, NULL, 78);
INSERT INTO public.product_variants VALUES (53, 48, 'M', NULL, NULL, 89);
INSERT INTO public.product_variants VALUES (54, 48, 'L', NULL, NULL, 76);
INSERT INTO public.product_variants VALUES (55, 48, 'XL', NULL, NULL, 56);
INSERT INTO public.product_variants VALUES (56, 48, 'XXL', NULL, NULL, 40);
INSERT INTO public.product_variants VALUES (57, 49, '36', NULL, NULL, 5);
INSERT INTO public.product_variants VALUES (58, 49, '37', NULL, NULL, 7);
INSERT INTO public.product_variants VALUES (59, 49, '38', NULL, NULL, 56);
INSERT INTO public.product_variants VALUES (60, 49, '39', NULL, NULL, 76);
INSERT INTO public.product_variants VALUES (61, 49, '40', NULL, NULL, 54);
INSERT INTO public.product_variants VALUES (62, 49, '41', NULL, NULL, 30);
INSERT INTO public.product_variants VALUES (63, 49, '42', NULL, NULL, 14);
INSERT INTO public.product_variants VALUES (64, 49, '43', NULL, NULL, 10);
INSERT INTO public.product_variants VALUES (65, 49, '44', NULL, NULL, 9);
INSERT INTO public.product_variants VALUES (66, 49, '45', NULL, NULL, 8);
INSERT INTO public.product_variants VALUES (67, 50, '36', NULL, NULL, 2);
INSERT INTO public.product_variants VALUES (68, 50, '37', NULL, NULL, 3);
INSERT INTO public.product_variants VALUES (69, 50, '38', NULL, NULL, 8);
INSERT INTO public.product_variants VALUES (70, 50, '39', NULL, NULL, 70);
INSERT INTO public.product_variants VALUES (71, 50, '40', NULL, NULL, 87);
INSERT INTO public.product_variants VALUES (72, 50, '41', NULL, NULL, 56);
INSERT INTO public.product_variants VALUES (73, 50, '42', NULL, NULL, 450);
INSERT INTO public.product_variants VALUES (74, 50, '43', NULL, NULL, 54);
INSERT INTO public.product_variants VALUES (75, 50, '44', NULL, NULL, 34);
INSERT INTO public.product_variants VALUES (76, 50, '45', NULL, NULL, 15);


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products VALUES (42, 'Tshirt', 'Dark green (sometimes described as "grass green" or "verde prato") base color.', NULL, '/uploads/1782385704088-images (1).jpg', 0, '2026-06-25 13:08:24.147901', 0, 300.00, 500.00, true, NULL, 11, 5, NULL, NULL, NULL);
INSERT INTO public.products VALUES (43, 'Iphone17', 'new', NULL, '/uploads/1782386022115-images.jpg', 0, '2026-06-25 13:13:42.188346', 0, 500.00, 1000.00, true, NULL, 3, 3, NULL, NULL, NULL);
INSERT INTO public.products VALUES (44, 'Laptop', '14 inch', NULL, '/uploads/1782386128943-laptop.jpg', 0, '2026-06-25 13:15:28.995816', 0, 700.00, 1200.00, true, NULL, 3, 3, NULL, NULL, NULL);
INSERT INTO public.products VALUES (45, 'Camera', ' 60-megapixel full-frame Exmor R CMOS sensor.', NULL, '/uploads/1782386225388-a7cr.jpg', 0, '2026-06-25 13:17:05.442612', 0, 500.00, 650.00, true, NULL, 9, 3, NULL, NULL, NULL);
INSERT INTO public.products VALUES (46, 'Galaxy s24', ' 6.2-inch Dynamic LTPO AMOLED 2X', NULL, '/uploads/1782386336187-s24.jpg', 0, '2026-06-25 13:18:56.244555', 0, 500.00, 800.00, true, NULL, 4, 3, NULL, NULL, NULL);
INSERT INTO public.products VALUES (47, 'Tshirt', 'Black', NULL, '/uploads/1782386436879-tshirt.jpg', 0, '2026-06-25 13:20:36.929682', 0, 5.00, 25.00, true, NULL, 1, 5, NULL, NULL, NULL);
INSERT INTO public.products VALUES (48, 'Tshirt', 'The shirt features a large arched "NIKE" wordmark on the chest, layered with a dynamic red "Fired Up" graffiti tag and the Russell Wilson "3" logo', NULL, '/uploads/1782386510448-tyshirt.jpg', 0, '2026-06-25 13:21:50.550951', 0, 25.00, 50.00, true, NULL, 1, 5, NULL, NULL, NULL);
INSERT INTO public.products VALUES (49, 'Jordans', ' Black, Varsity Red, and White', NULL, '/uploads/1782386619526-jordan.jpg', 0, '2026-06-25 13:23:39.583003', 0, 50.00, 150.00, true, NULL, 1, 2, NULL, NULL, NULL);
INSERT INTO public.products VALUES (50, 'Oceaunz League', ' Wrapped in a triple "Core Black" blackout style with tonal matte and gloss accents, obscuring heavy branding for a clean, professional aesthetic', NULL, '/uploads/1782386729719-addidas.jpg', 0, '2026-06-25 13:25:29.775572', 0, 50.00, 250.00, true, NULL, 2, 2, NULL, NULL, NULL);


--
-- Data for Name: store_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.store_settings VALUES (1, 'My Store1', 'store@gmail.com', '+355691234567', 'Tirana, Albania', '2026-06-22 15:36:04.110454', '2026-06-22 15:36:04.110454');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (6, 'Livia Gumeni', 'liviagumeni@gmail.com', NULL, NULL, NULL, NULL, NULL, true, '2026-06-17 14:33:36.589804', '2026-06-17 14:33:36.589804', 'user');
INSERT INTO public.users VALUES (9, 'Admin', 'admin1@shop.com', '$2b$10$2zB2OdHj8/TfDOJiW4tHIenTZDtO4PjWTQCaoqyv9D4WZpNQDBof2', NULL, NULL, NULL, NULL, true, '2026-06-18 10:50:17.381071', '2026-06-18 10:50:17.381071', 'admin');
INSERT INTO public.users VALUES (5, 'livia1', 'livia2@gmail.com', '$2b$10$rRFLgFdx71k7lWqx8iRyo.7oxzUoLd.jH7EhX43NeVxwI4bNa2kiK', NULL, NULL, NULL, 'ali dem', true, '2026-06-17 14:03:50.98457', '2026-06-17 14:03:50.98457', 'user');
INSERT INTO public.users VALUES (2, 'Livia', 'livia@gmail.com', '$2b$10$FThY6.IS9nRA.BwxtUy8BeiZbZL95e6K/zEMAHNGrUaSp9hKmaWsi', NULL, NULL, NULL, 'ali dem', true, '2026-06-17 10:47:24.411185', '2026-06-17 10:47:24.411185', 'user');
INSERT INTO public.users VALUES (10, 'livia', 'livia1@gmail.com', '$2b$10$xruYcqbEbFc3YTmsk.YzOeQECrTRvXdTj2k13VUBd/Mq4vpGyGVgq', NULL, NULL, NULL, NULL, true, '2026-06-25 11:50:03.923375', '2026-06-25 11:50:03.923375', 'user');


--
-- Name: brands_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.brands_id_seq', 11, true);


--
-- Name: cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 8, true);


--
-- Name: coupons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupons_id_seq', 2, true);


--
-- Name: favorites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.favorites_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 65, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 67, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: product_colors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_colors_id_seq', 4, true);


--
-- Name: product_memory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_memory_id_seq', 16, true);


--
-- Name: product_sizes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_sizes_id_seq', 126, true);


--
-- Name: product_variants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.product_variants_id_seq', 76, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 50, true);


--
-- Name: store_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.store_settings_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: brands brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_pkey PRIMARY KEY (id);


--
-- Name: cart cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_code_key UNIQUE (code);


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: product_colors product_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_pkey PRIMARY KEY (id);


--
-- Name: product_memory product_memory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_memory
    ADD CONSTRAINT product_memory_pkey PRIMARY KEY (id);


--
-- Name: product_sizes product_sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sizes
    ADD CONSTRAINT product_sizes_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_product_id_size_color_memory_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_size_color_memory_key UNIQUE (product_id, size, color, memory);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: store_settings store_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_settings
    ADD CONSTRAINT store_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: brands brands_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.brands
    ADD CONSTRAINT brands_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: cart cart_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart cart_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart
    ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products fk_brand; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_brand FOREIGN KEY (brand_id) REFERENCES public.brands(id);


--
-- Name: products fk_category; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: product_colors product_colors_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_colors
    ADD CONSTRAINT product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_memory product_memory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_memory
    ADD CONSTRAINT product_memory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_sizes product_sizes_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_sizes
    ADD CONSTRAINT product_sizes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict DhyTI9DxzeM1KkjWwUtHLGA8RC2hPhlXfZw1Vp8EYqezX5kNTZMdKiH9fhVSBsS

