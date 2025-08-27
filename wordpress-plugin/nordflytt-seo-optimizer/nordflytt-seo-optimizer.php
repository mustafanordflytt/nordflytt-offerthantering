<?php
/**
 * Plugin Name: Nordflytt SEO Optimizer
 * Plugin URI: https://nordflytt.se/seo-optimizer
 * Description: AI-driven SEO optimization for Nordflytt website
 * Version: 1.0.0
 * Author: Nordflytt Development Team
 * License: Proprietary
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('NORDFLYTT_SEO_VERSION', '1.0.0');
define('NORDFLYTT_SEO_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NORDFLYTT_SEO_PLUGIN_URL', plugin_dir_url(__FILE__));
define('NORDFLYTT_SEO_API_ENDPOINT', 'https://api.nordflytt.se/seo-stockholm');

// Include required files
require_once NORDFLYTT_SEO_PLUGIN_DIR . 'includes/class-api-client.php';
require_once NORDFLYTT_SEO_PLUGIN_DIR . 'includes/class-content-optimizer.php';
require_once NORDFLYTT_SEO_PLUGIN_DIR . 'includes/class-schema-generator.php';
require_once NORDFLYTT_SEO_PLUGIN_DIR . 'includes/class-performance-tracker.php';
require_once NORDFLYTT_SEO_PLUGIN_DIR . 'includes/class-admin-interface.php';

/**
 * Main plugin class
 */
class Nordflytt_SEO_Optimizer {
    
    private static $instance = null;
    private $api_client;
    private $content_optimizer;
    private $schema_generator;
    private $performance_tracker;
    private $admin_interface;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->init_components();
        $this->setup_hooks();
    }
    
    /**
     * Initialize plugin components
     */
    private function init_components() {
        $this->api_client = new Nordflytt_API_Client();
        $this->content_optimizer = new Nordflytt_Content_Optimizer();
        $this->schema_generator = new Nordflytt_Schema_Generator();
        $this->performance_tracker = new Nordflytt_Performance_Tracker();
        $this->admin_interface = new Nordflytt_Admin_Interface();
    }
    
    /**
     * Setup WordPress hooks
     */
    private function setup_hooks() {
        // Activation/Deactivation
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Core hooks
        add_action('init', array($this, 'init'));
        add_action('wp_head', array($this, 'inject_optimizations'), 1);
        add_action('save_post', array($this, 'optimize_post_content'), 10, 3);
        add_filter('the_content', array($this, 'filter_content'), 20);
        
        // API endpoints
        add_action('rest_api_init', array($this, 'register_api_endpoints'));
        
        // Cron jobs
        add_action('nordflytt_seo_daily_sync', array($this, 'daily_sync'));
        
        // Admin hooks
        if (is_admin()) {
            add_action('admin_menu', array($this->admin_interface, 'add_menu_pages'));
            add_action('admin_enqueue_scripts', array($this->admin_interface, 'enqueue_admin_assets'));
        }
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create database tables
        $this->create_tables();
        
        // Schedule cron jobs
        if (!wp_next_scheduled('nordflytt_seo_daily_sync')) {
            wp_schedule_event(time(), 'daily', 'nordflytt_seo_daily_sync');
        }
        
        // Set default options
        add_option('nordflytt_seo_api_key', '');
        add_option('nordflytt_seo_auto_optimize', 'yes');
        add_option('nordflytt_seo_schema_enabled', 'yes');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled cron jobs
        wp_clear_scheduled_hook('nordflytt_seo_daily_sync');
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        // Load textdomain for translations
        load_plugin_textdomain('nordflytt-seo', false, dirname(plugin_basename(__FILE__)) . '/languages');
        
        // Register custom post types if needed
        $this->register_post_types();
        
        // Initialize real-time connection
        if (get_option('nordflytt_seo_realtime_enabled') === 'yes') {
            add_action('wp_footer', array($this, 'init_realtime_connection'));
        }
    }
    
    /**
     * Inject SEO optimizations in head
     */
    public function inject_optimizations() {
        global $post;
        
        if (!is_singular() || !$post) {
            return;
        }
        
        // Get optimized meta data
        $meta_data = $this->content_optimizer->get_optimized_meta($post->ID);
        
        // Output meta tags
        if ($meta_data) {
            echo "\n<!-- Nordflytt SEO Optimizer -->\n";
            
            if (!empty($meta_data['title'])) {
                echo '<meta property="og:title" content="' . esc_attr($meta_data['title']) . '" />' . "\n";
            }
            
            if (!empty($meta_data['description'])) {
                echo '<meta name="description" content="' . esc_attr($meta_data['description']) . '" />' . "\n";
                echo '<meta property="og:description" content="' . esc_attr($meta_data['description']) . '" />' . "\n";
            }
            
            // Schema.org structured data
            $schema = $this->schema_generator->generate_schema($post);
            if ($schema) {
                echo '<script type="application/ld+json">' . wp_json_encode($schema) . '</script>' . "\n";
            }
            
            echo "<!-- /Nordflytt SEO Optimizer -->\n\n";
        }
        
        // Track page view
        $this->performance_tracker->track_pageview($post->ID);
    }
    
    /**
     * Optimize post content on save
     */
    public function optimize_post_content($post_id, $post, $update) {
        // Skip auto-saves and revisions
        if (wp_is_post_autosave($post_id) || wp_is_post_revision($post_id)) {
            return;
        }
        
        // Check if auto-optimization is enabled
        if (get_option('nordflytt_seo_auto_optimize') !== 'yes') {
            return;
        }
        
        // Optimize content
        $optimized_content = $this->content_optimizer->optimize_content($post->post_content, $post_id);
        
        // Update meta description
        $meta_description = $this->content_optimizer->generate_meta_description($post->post_content);
        update_post_meta($post_id, '_nordflytt_meta_description', $meta_description);
        
        // Send to API for AI analysis
        $this->api_client->analyze_content($post_id, $post->post_content);
    }
    
    /**
     * Filter content for front-end display
     */
    public function filter_content($content) {
        global $post;
        
        if (!is_singular() || !$post) {
            return $content;
        }
        
        // Add internal linking suggestions
        $content = $this->content_optimizer->add_internal_links($content, $post->ID);
        
        // Add CTA if configured
        if (get_post_meta($post->ID, '_nordflytt_add_cta', true) === 'yes') {
            $cta_html = $this->get_cta_html($post->ID);
            $content .= $cta_html;
        }
        
        return $content;
    }
    
    /**
     * Register REST API endpoints
     */
    public function register_api_endpoints() {
        register_rest_route('nordflytt-seo/v1', '/sync', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_sync_request'),
            'permission_callback' => array($this, 'check_api_permission')
        ));
        
        register_rest_route('nordflytt-seo/v1', '/optimize', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_optimize_request'),
            'permission_callback' => array($this, 'check_api_permission')
        ));
        
        register_rest_route('nordflytt-seo/v1', '/performance', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_performance_data'),
            'permission_callback' => array($this, 'check_api_permission')
        ));
    }
    
    /**
     * Daily sync with SEO Stockholm dashboard
     */
    public function daily_sync() {
        // Get all published posts
        $posts = get_posts(array(
            'post_type' => array('post', 'page'),
            'post_status' => 'publish',
            'numberposts' => -1
        ));
        
        $sync_data = array();
        
        foreach ($posts as $post) {
            $sync_data[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'url' => get_permalink($post),
                'modified' => $post->post_modified,
                'meta_description' => get_post_meta($post->ID, '_nordflytt_meta_description', true),
                'focus_keyword' => get_post_meta($post->ID, '_nordflytt_focus_keyword', true),
                'performance' => $this->performance_tracker->get_post_performance($post->ID)
            );
        }
        
        // Send to API
        $this->api_client->sync_content($sync_data);
    }
    
    /**
     * Initialize real-time connection
     */
    public function init_realtime_connection() {
        $api_key = get_option('nordflytt_seo_api_key');
        if (empty($api_key)) {
            return;
        }
        ?>
        <script>
        (function() {
            const ws = new WebSocket('wss://api.nordflytt.se/seo-realtime');
            
            ws.onopen = function() {
                ws.send(JSON.stringify({
                    type: 'auth',
                    apiKey: '<?php echo esc_js($api_key); ?>',
                    domain: '<?php echo esc_js(get_site_url()); ?>'
                }));
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                
                // Handle real-time optimization suggestions
                if (data.type === 'optimization') {
                    console.log('SEO Optimization received:', data);
                    // Could trigger UI updates or notifications
                }
            };
        })();
        </script>
        <?php
    }
    
    /**
     * Create database tables
     */
    private function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}nordflytt_seo_performance (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            date date NOT NULL,
            pageviews int(11) DEFAULT 0,
            unique_visitors int(11) DEFAULT 0,
            avg_time_on_page float DEFAULT 0,
            bounce_rate float DEFAULT 0,
            conversions int(11) DEFAULT 0,
            PRIMARY KEY (id),
            KEY post_id (post_id),
            KEY date (date)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    /**
     * Register custom post types
     */
    private function register_post_types() {
        // Could register custom post types for landing pages, etc.
    }
    
    /**
     * Get CTA HTML
     */
    private function get_cta_html($post_id) {
        $cta_text = get_post_meta($post_id, '_nordflytt_cta_text', true);
        $cta_button = get_post_meta($post_id, '_nordflytt_cta_button', true);
        $cta_link = get_post_meta($post_id, '_nordflytt_cta_link', true);
        
        if (empty($cta_text)) {
            $cta_text = 'Behöver du hjälp med din flytt?';
        }
        if (empty($cta_button)) {
            $cta_button = 'Få gratis offert';
        }
        if (empty($cta_link)) {
            $cta_link = '/kontakt';
        }
        
        ob_start();
        ?>
        <div class="nordflytt-cta-box" style="background: #f8f9fa; padding: 2rem; margin: 2rem 0; border-radius: 8px; text-align: center;">
            <h3 style="color: #002A5C; margin-bottom: 1rem;"><?php echo esc_html($cta_text); ?></h3>
            <a href="<?php echo esc_url($cta_link); ?>" class="nordflytt-cta-button" style="display: inline-block; background: #002A5C; color: white; padding: 0.75rem 2rem; text-decoration: none; border-radius: 4px; font-weight: bold;">
                <?php echo esc_html($cta_button); ?>
            </a>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * API permission check
     */
    public function check_api_permission($request) {
        $api_key = $request->get_header('X-API-Key');
        $stored_key = get_option('nordflytt_seo_api_key');
        
        return !empty($api_key) && $api_key === $stored_key;
    }
    
    /**
     * Handle sync request
     */
    public function handle_sync_request($request) {
        $this->daily_sync();
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    /**
     * Handle optimize request
     */
    public function handle_optimize_request($request) {
        $post_id = $request->get_param('post_id');
        
        if (!$post_id) {
            return new WP_Error('missing_post_id', 'Post ID is required', array('status' => 400));
        }
        
        $post = get_post($post_id);
        if (!$post) {
            return new WP_Error('invalid_post', 'Post not found', array('status' => 404));
        }
        
        // Trigger optimization
        $this->optimize_post_content($post_id, $post, true);
        
        return new WP_REST_Response(array('success' => true, 'post_id' => $post_id), 200);
    }
    
    /**
     * Get performance data
     */
    public function get_performance_data($request) {
        $post_id = $request->get_param('post_id');
        $start_date = $request->get_param('start_date');
        $end_date = $request->get_param('end_date');
        
        $data = $this->performance_tracker->get_performance_data($post_id, $start_date, $end_date);
        
        return new WP_REST_Response($data, 200);
    }
}

// Initialize plugin
add_action('plugins_loaded', array('Nordflytt_SEO_Optimizer', 'get_instance'));