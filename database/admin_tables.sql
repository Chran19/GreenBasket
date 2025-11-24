-- Admin actions log table
CREATE TABLE admin_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- activate_user, suspend_user, resolve_dispute, etc.
    target_id UUID, -- ID of the target (user, dispute, etc.)
    reason TEXT,
    metadata JSONB, -- Additional action data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform settings table
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platform settings
INSERT INTO platform_settings (setting_key, setting_value, description) VALUES
('commission_rate', '0.07', 'Platform commission rate (7%)'),
('max_file_size', '5242880', 'Maximum file upload size in bytes (5MB)'),
('low_stock_threshold', '10', 'Default low stock alert threshold'),
('order_auto_cancel_hours', '24', 'Hours after which unpaid orders are auto-cancelled'),
('review_moderation', 'false', 'Whether reviews require admin approval');

-- Indexes for admin tables
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);

-- Triggers for admin tables
CREATE TRIGGER update_platform_settings_updated_at 
BEFORE UPDATE ON platform_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
