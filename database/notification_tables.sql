-- Email logs table
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price alerts table (for price drop notifications)
CREATE TABLE price_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Add tracking number to orders table
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100);

-- Indexes for performance
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_product_id ON price_alerts(product_id);
CREATE INDEX idx_price_alerts_active ON price_alerts(is_active);

-- Function to check for price drops and send notifications
CREATE OR REPLACE FUNCTION check_price_drops()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check if price decreased
    IF NEW.price < OLD.price THEN
        -- Find users with price alerts for this product
        INSERT INTO notifications (user_id, title, message, type, data)
        SELECT 
            pa.user_id,
            'Price Drop Alert!',
            'The price of ' || NEW.title || ' has dropped from $' || OLD.price || ' to $' || NEW.price,
            'price_drop',
            jsonb_build_object(
                'product_id', NEW.id,
                'old_price', OLD.price,
                'new_price', NEW.price,
                'product_title', NEW.title
            )
        FROM price_alerts pa
        WHERE pa.product_id = NEW.id 
        AND pa.is_active = true 
        AND pa.target_price >= NEW.price;

        -- Deactivate alerts that have been triggered
        UPDATE price_alerts 
        SET is_active = false 
        WHERE product_id = NEW.id 
        AND target_price >= NEW.price;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for price drop notifications
CREATE TRIGGER trigger_price_drop_notifications
    AFTER UPDATE OF price ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_price_drops();

-- Function to send order placed notifications
CREATE OR REPLACE FUNCTION notify_order_placed()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify buyer
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
        NEW.buyer_id,
        'Order Placed Successfully',
        'Your order #' || NEW.id || ' has been placed and is awaiting farmer confirmation',
        'order_placed',
        jsonb_build_object('order_id', NEW.id)
    );

    -- Notify farmer
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
        NEW.farmer_id,
        'New Order Received',
        'You have received a new order #' || NEW.id || ' worth $' || NEW.total_price,
        'new_order',
        jsonb_build_object('order_id', NEW.id)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for order placed notifications
CREATE TRIGGER trigger_order_placed_notifications
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION notify_order_placed();
