CREATE TABLE "menu_items" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Mains' NOT NULL,
	"price_inr" integer NOT NULL,
	"is_veg" boolean DEFAULT true NOT NULL,
	"available" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"menu_item_id" text NOT NULL,
	"name" text NOT NULL,
	"unit_price_inr" integer NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"restaurant_name" text NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"delivery_mode" text DEFAULT 'standard' NOT NULL,
	"eco_packaging" boolean DEFAULT true NOT NULL,
	"address" text NOT NULL,
	"payment_method" text DEFAULT 'simulated-upi' NOT NULL,
	"subtotal_inr" integer NOT NULL,
	"delivery_fee_inr" integer NOT NULL,
	"packaging_fee_inr" integer NOT NULL,
	"tax_inr" integer NOT NULL,
	"total_inr" integer NOT NULL,
	"co2_saved_grams" integer DEFAULT 0 NOT NULL,
	"eco_points_earned" integer DEFAULT 0 NOT NULL,
	"created_at" text DEFAULT now() NOT NULL,
	"updated_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cuisine" text NOT NULL,
	"city" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"rating" real DEFAULT 4.2 NOT NULL,
	"delivery_mins" integer DEFAULT 30 NOT NULL,
	"distance_km" real DEFAULT 3 NOT NULL,
	"eco_certified" boolean DEFAULT false NOT NULL,
	"is_veg" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_email" text NOT NULL,
	"order_id" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" text DEFAULT now() NOT NULL
);

--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r1','Saravana Bhavan Green','South Indian','Bengaluru','Crisp dosas, fluffy idlis and filter coffee served in compostable ware.','https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800',4.6,25,2.1,true,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r1m0','r1','Masala Dosa','Crispy rice crepe with spiced potato','Tiffin',120,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r1m1','r1','Idli Vada Combo','2 idli, 1 vada, sambar, chutneys','Tiffin',95,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r1m2','r1','Ven Pongal','Peppery rice-lentil comfort dish','Tiffin',110,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r1m3','r1','Mini Meals','Rice, sambar, rasam, 2 curries, curd','Mains',180,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r1m4','r1','Filter Coffee','South Indian decoction coffee','Drinks',40,true,true);
--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r2','Punjab Grill Tandoor','North Indian','Delhi','Smoky tandoor classics and rich gravies.','https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',4.4,35,4.5,false,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r2m0','r2','Butter Chicken','Creamy tomato gravy, tandoori chicken','Mains',340,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r2m1','r2','Paneer Tikka','Charred cottage cheese, mint chutney','Starters',260,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r2m2','r2','Dal Makhani','Slow-cooked black lentils','Mains',230,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r2m3','r2','Garlic Naan','Tandoor-baked bread','Breads',55,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r2m4','r2','Chicken Tikka','Yogurt-marinated grilled chicken','Starters',290,false,true);
--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r3','Green Leaf Thali','Gujarati','Ahmedabad','Pure-veg unlimited-style thali, zero single-use plastic.','https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800',4.5,30,3.2,true,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r3m0','r3','Gujarati Thali','Dal, kadhi, 2 sabzi, roti, rice, sweet','Thali',260,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r3m1','r3','Dhokla Plate','Steamed gram-flour cakes','Snacks',90,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r3m2','r3','Thepla Combo','6 methi thepla with pickle & curd','Snacks',120,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r3m3','r3','Undhiyu','Seasonal mixed-vegetable specialty','Mains',190,true,true);
--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r4','Dum Pukht Biryani House','Hyderabadi','Hyderabad','Dum-cooked biryanis sealed and slow-steamed.','https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800',4.5,40,5,false,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r4m0','r4','Chicken Dum Biryani','Basmati, chicken, saffron, raita','Biryani',320,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r4m1','r4','Veg Biryani','Seasonal vegetables, whole spices','Biryani',240,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r4m2','r4','Mutton Biryani','Tender mutton dum biryani','Biryani',420,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r4m3','r4','Mirchi Ka Salan','Peanut-sesame chilli curry','Sides',110,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r4m4','r4','Double Ka Meetha','Hyderabadi bread pudding','Dessert',120,true,true);
--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r5','Mumbai Chaat Cart','Street Food','Mumbai','Pav bhaji, vada pav and chaat in biodegradable bowls.','https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800',4.3,20,1.8,true,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r5m0','r5','Vada Pav','Spiced potato fritter in pav','Snacks',40,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r5m1','r5','Pav Bhaji','Buttery mashed veg curry, 2 pav','Mains',150,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r5m2','r5','Pani Puri','6 puris with spiced water','Chaat',70,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r5m3','r5','Sev Puri','Crisp puris, chutneys, sev','Chaat',80,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r5m4','r5','Masala Chai','Ginger-cardamom tea','Drinks',30,true,true);
--> statement-breakpoint
INSERT INTO restaurants (id,name,cuisine,city,description,image_url,rating,delivery_mins,distance_km,eco_certified,is_veg,active) VALUES ('r6','Kerala Kitchen','Kerala','Kochi','Coastal Kerala meals on banana leaf.','https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800',4.4,35,4,true,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r6m0','r6','Appam & Veg Stew','3 appams with coconut stew','Mains',170,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r6m1','r6','Kerala Fish Curry Meal','Red fish curry, rice, thoran','Mains',280,false,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r6m2','r6','Malabar Parotta','2 flaky parottas with salna','Breads',110,true,true);
--> statement-breakpoint
INSERT INTO menu_items (id,restaurant_id,name,description,category,price_inr,is_veg,available) VALUES ('r6m3','r6','Payasam','Jaggery & coconut milk dessert','Dessert',90,true,true);
