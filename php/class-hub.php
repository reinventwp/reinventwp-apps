<?php
/**
 * "Reinvent WP" admin menu shared by all Reinvent WP plugins.
 *
 * Same idea as Meow Apps' common/admin.php: every plugin ships its own copy of
 * this file under its own class name. The copy with the highest HUB_VERSION
 * registers the top-level menu and the dashboard; every plugin then adds its
 * own submenu with {{CLASS}}::add_app(). Keep the shared names below
 * (reinventwp_hub, reinventwp-apps) identical in every plugin.
 *
 * Generated from plugins/dashboard/php/class-hub.php by scripts/install-into.sh;
 * edit it there, not here. From 2.0.0 the dashboard is a React + MUI page
 * (public/hub/reinventwp-apps.js) and the app list comes from Reinvent WP
 * Services, cached for a day, with the list below as the fallback. The
 * assistant (public/hub/bot.js) runs on the dashboard and on the own pages of
 * the plugins that ship this class.
 *
 * @package {{PACKAGE}}
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Shared Reinvent WP menu.
 */
class {{CLASS}} {

	/**
	 * Bump when the menu or dashboard changes; the highest version wins.
	 */
	const HUB_VERSION = '2.0.0';

	/**
	 * Top-level menu slug shared by all Reinvent WP plugins.
	 */
	const SLUG = 'reinventwp-apps';

	/**
	 * Reinvent WP Services plugin endpoints (the app list and the assistant).
	 */
	const SERVICES_URL = 'https://services.reinventwp.com/api/reinvent/plugins';

	/**
	 * Cached app list (shared by every copy of this version).
	 */
	const CATALOG_TRANSIENT = 'reinventwp_hub_catalog_v2';

	/**
	 * Product pages on the catalog are paths on this site.
	 */
	const SITE_URL = 'https://reinventwp.com';

	/**
	 * Nonce action of the Refresh button.
	 */
	const REFRESH_ACTION = 'reinventwp_apps_refresh';

	/**
	 * Whether this copy registered the menu (and so owns the dashboard).
	 *
	 * @var bool
	 */
	private static $owner = false;

	/**
	 * Register this copy as a candidate.
	 *
	 * @return void
	 */
	public static function init() {
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Shared across all Reinvent WP plugins on purpose.
		$GLOBALS['reinventwp_hub'][ self::HUB_VERSION ] = __CLASS__;
		// This plugin's own page shows the assistant too (only plugins that ship this class).
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Shared across all Reinvent WP plugins on purpose.
		$GLOBALS['reinventwp_bot_plugins']['{{TEXT_DOMAIN}}'] = true;
		add_action( 'admin_menu', array( __CLASS__, 'maybe_register' ), 5 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue' ) );
	}

	/**
	 * Only the newest copy registers the menu.
	 *
	 * @return void
	 */
	public static function maybe_register() {
		global $submenu;
		$versions = array_keys( (array) $GLOBALS['reinventwp_hub'] );
		usort( $versions, 'version_compare' );
		if ( end( $versions ) !== self::HUB_VERSION || isset( $submenu[ self::SLUG ] ) ) {
			return;
		}
		self::$owner = true;
		$cap         = 'manage_options';
		add_menu_page(
			__( 'Reinvent WP', '{{TEXT_DOMAIN}}' ),
			__( 'Reinvent WP', '{{TEXT_DOMAIN}}' ),
			$cap,
			self::SLUG,
			array( __CLASS__, 'render' ),
			self::icon(),
			81
		);
		add_submenu_page( self::SLUG, __( 'Reinvent WP Apps', '{{TEXT_DOMAIN}}' ), __( 'Dashboard', '{{TEXT_DOMAIN}}' ), $cap, self::SLUG, array( __CLASS__, 'render' ) );
	}

	/**
	 * Add a plugin's page to the Reinvent WP menu. Call it from an admin_menu callback
	 * (default priority), after the menu exists.
	 *
	 * Pass a full admin URL path (e.g. "upload.php?page=x") to link to a page that
	 * lives elsewhere, so the plugin keeps one real page and appears in both menus.
	 *
	 * @param string $title Menu label.
	 * @param string $target Page path relative to wp-admin.
	 * @param string $cap Capability.
	 * @return void
	 */
	public static function add_app( $title, $target, $cap = 'manage_options' ) {
		add_submenu_page( self::SLUG, $title, $title, $cap, $target );
	}

	/**
	 * Every Reinvent WP app: the list from Reinvent WP Services when it could be read,
	 * otherwise the built-in one. Apps with 'released' => false only get a card on
	 * sites where they're already installed.
	 *
	 * @return array
	 */
	public static function catalog() {
		$apps = self::remote_catalog();
		if ( empty( $apps ) ) {
			$apps = self::bundled_catalog();
		}
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Shared across all Reinvent WP plugins on purpose.
		return (array) apply_filters( 'reinventwp_hub_apps', $apps );
	}

	/**
	 * Built-in list, used when Reinvent WP Services can't be reached. Same order and
	 * pages as the default catalog in reinventwp-services (src/reinvent/utils/pluginCatalog.ts).
	 *
	 * @return array
	 */
	private static function bundled_catalog() {
		$app = function ( $slug, $name, $description, $category, $page = '', $released = false, $href = '' ) {
			return array(
				'name'        => $name,
				'description' => $description,
				'file'        => $slug . '/' . $slug . '.php',
				'slug'        => $slug,
				'page'        => $page,
				'released'    => $released,
				'category'    => $category,
				'href'        => $href,
			);
		};
		return array(
			$app( 'natural-text-to-speech', 'Text to Speech', __( 'Read posts aloud with natural voices and highlight words as they are spoken.', '{{TEXT_DOMAIN}}' ), __( 'Content', '{{TEXT_DOMAIN}}' ), 'admin.php?page=natuteto-settings', true, self::SITE_URL . '/text-to-speech' ),
			$app( 'reinvent-media-cleanup', 'Media Cleanup', __( 'Find unused images and files and remove them safely, with a safety net.', '{{TEXT_DOMAIN}}' ), __( 'Media', '{{TEXT_DOMAIN}}' ), 'upload.php?page=rwpmc-media-cleanup', true ),
			$app( 'reinvent-retina-images', 'Retina Images', __( 'Sharp retina images, fix blurry or missing image sizes and free up space.', '{{TEXT_DOMAIN}}' ), __( 'Media', '{{TEXT_DOMAIN}}' ), 'upload.php?page=rwprt-thumbnails' ),
			$app( 'reinvent-rename-replace-media', 'Rename & Replace Media', __( 'Give images SEO-friendly names and swap files without breaking links, with undo.', '{{TEXT_DOMAIN}}' ), __( 'Media', '{{TEXT_DOMAIN}}' ), 'upload.php?page=rwprm-rename' ),
			$app( 'reinvent-database-cleaner', 'Database Cleaner', __( 'Clean up and speed up your database, see which plugin left what behind, and undo anything.', '{{TEXT_DOMAIN}}' ), __( 'Performance', '{{TEXT_DOMAIN}}' ), 'tools.php?page=rwpdc-cleaner' ),
			$app( 'reinvent-lightbox', 'Lightbox', __( 'Open images and galleries in a fast lightbox with photo details, slideshow, zoom and shareable links.', '{{TEXT_DOMAIN}}' ), __( 'Media', '{{TEXT_DOMAIN}}' ), 'admin.php?page=rwplb-settings' ),
			$app( 'reinvent-watermark', 'Watermark', __( 'Add a text or logo watermark to your images on upload or in bulk, and remove it any time.', '{{TEXT_DOMAIN}}' ), __( 'Media', '{{TEXT_DOMAIN}}' ), 'upload.php?page=rwpwm-watermark' ),
		);
	}

	/**
	 * A Reinvent WP Services plugin endpoint. Local sites use a local Reinvent WP Services
	 * instance, like the Text to Speech plugin does.
	 *
	 * @param string $path Endpoint after /plugins, like "/catalog".
	 * @return string
	 */
	private static function services_url( $path ) {
		$host = wp_parse_url( home_url(), PHP_URL_HOST );
		$base = in_array( strtolower( (string) $host ), array( 'localhost', '127.0.0.1', '::1' ), true )
			? 'http://localhost:3005/api/reinvent/plugins'
			: self::SERVICES_URL;
		return $base . $path;
	}

	/**
	 * Where to read the app list.
	 *
	 * @return string
	 */
	private static function catalog_url() {
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Shared across all Reinvent WP plugins on purpose.
		return (string) apply_filters( 'reinventwp_hub_catalog_url', self::services_url( '/catalog' ) );
	}

	/**
	 * Where the Apps page assistant sends questions (from the browser, only when the user asks).
	 *
	 * @return string
	 */
	private static function assistant_url() {
		// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Shared across all Reinvent WP plugins on purpose.
		return (string) apply_filters( 'reinventwp_hub_assistant_url', self::services_url( '/assistant' ) );
	}

	/**
	 * Where the assistant's feedback form sends to (Reinvent WP Services /feedback).
	 *
	 * @return string
	 */
	private static function feedback_url() {
		return (string) preg_replace( '#/plugins$#', '/feedback', self::services_url( '' ) );
	}

	/**
	 * App list from Reinvent WP Services, read at most once a day (once an hour after
	 * a failure). Nothing about the site is sent: it's a plain GET of a public list, with
	 * our own user agent instead of WordPress's (which contains the site URL).
	 *
	 * @return array Cleaned apps, or an empty array when the list couldn't be read.
	 */
	private static function remote_catalog() {
		$cached = get_transient( self::CATALOG_TRANSIENT );
		if ( is_array( $cached ) ) {
			return $cached;
		}
		$apps     = array();
		$response = wp_remote_get(
			self::catalog_url(),
			array(
				'timeout'    => 5,
				'user-agent' => 'ReinventWP-Apps/' . self::HUB_VERSION,
			)
		);
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body = json_decode( wp_remote_retrieve_body( $response ), true );
			if ( is_array( $body ) && isset( $body['data']['plugins'] ) && is_array( $body['data']['plugins'] ) ) {
				$apps = self::clean_remote( $body['data']['plugins'] );
			}
		}
		set_transient( self::CATALOG_TRANSIENT, $apps, empty( $apps ) ? HOUR_IN_SECONDS : DAY_IN_SECONDS );
		return $apps;
	}

	/**
	 * Keep only well-formed, visible apps from the remote list, in its order.
	 *
	 * @param array $items Raw "plugins" array from the API.
	 * @return array
	 */
	private static function clean_remote( $items ) {
		$apps = array();
		foreach ( array_slice( $items, 0, 100 ) as $item ) {
			if ( ! is_array( $item ) ) {
				continue;
			}
			$slug   = isset( $item['slug'] ) ? (string) $item['slug'] : '';
			$file   = isset( $item['plugin_file'] ) ? (string) $item['plugin_file'] : '';
			$page   = isset( $item['admin_page'] ) ? (string) $item['admin_page'] : '';
			$status = isset( $item['status'] ) ? (string) $item['status'] : '';
			$title  = isset( $item['title'] ) ? sanitize_text_field( (string) $item['title'] ) : '';
			$short  = isset( $item['short_title'] ) ? sanitize_text_field( (string) $item['short_title'] ) : '';
			if (
				! preg_match( '/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slug )
				|| ! preg_match( '/^[a-z0-9-]+\/[a-z0-9._-]+\.php$/i', $file )
				|| ( '' !== $page && ! preg_match( '/^[a-z0-9-]+\.php(\?[a-z0-9=&_-]*)?$/i', $page ) )
				|| ! in_array( $status, array( 'available', 'coming-soon' ), true )
				|| '' === $title
			) {
				continue;
			}
			$apps[] = array(
				'name'        => '' !== $short ? $short : preg_replace( '/^Reinvent (WP )?/', '', $title ),
				'description' => isset( $item['description'] ) ? sanitize_text_field( (string) $item['description'] ) : '',
				'file'        => $file,
				'slug'        => $slug,
				'page'        => $page,
				'released'    => isset( $item['released'] ) && true === $item['released'],
				'category'    => isset( $item['category'] ) ? sanitize_text_field( (string) $item['category'] ) : '',
				'href'        => self::product_url( isset( $item['href'] ) ? (string) $item['href'] : '' ),
			);
		}
		return $apps;
	}

	/**
	 * Absolute product page URL: "/path" is on reinventwp.com, full URLs must be http(s).
	 *
	 * @param string $href Link from the catalog.
	 * @return string
	 */
	private static function product_url( $href ) {
		if ( '' === $href ) {
			return '';
		}
		if ( '/' === $href[0] && ( ! isset( $href[1] ) || '/' !== $href[1] ) ) {
			$href = self::SITE_URL . $href;
		}
		return (string) esc_url_raw( $href, array( 'http', 'https' ) );
	}

	/**
	 * Plugins-screen activation link. Built with add_query_arg, not wp_nonce_url: that one
	 * returns an HTML-escaped URL ("&amp;"), which breaks once React puts it in an href.
	 *
	 * @param string $file Plugin file relative to wp-content/plugins.
	 * @return string
	 */
	private static function activate_url( $file ) {
		return add_query_arg(
			array(
				'action'   => 'activate',
				'plugin'   => rawurlencode( $file ),
				'_wpnonce' => wp_create_nonce( 'activate-plugin_' . $file ),
			),
			admin_url( 'plugins.php' )
		);
	}

	/**
	 * Cards for the React page: the visible apps with their state and links.
	 *
	 * @return array
	 */
	private static function apps_for_page() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$installed    = get_plugins();
		$can_activate = current_user_can( 'activate_plugins' );
		$can_install  = current_user_can( 'install_plugins' );
		$cards        = array();
		foreach ( self::catalog() as $app ) {
			$is_installed = isset( $installed[ $app['file'] ] );
			if ( empty( $app['released'] ) && ! $is_installed ) {
				continue;
			}
			$is_active = $is_installed && is_plugin_active( $app['file'] );
			$cards[]   = array(
				'slug'         => $app['slug'],
				'name'         => $app['name'],
				'description'  => $app['description'],
				'category'     => $app['category'],
				'state'        => $is_active ? 'active' : ( $is_installed ? 'inactive' : 'missing' ),
				'version'      => $is_installed ? (string) $installed[ $app['file'] ]['Version'] : '',
				'open_url'     => $is_active && ! empty( $app['page'] ) ? admin_url( $app['page'] ) : '',
				'activate_url' => $is_installed && ! $is_active && $can_activate ? self::activate_url( $app['file'] ) : '',
				'install_url'  => ! $is_installed && $can_install ? admin_url( 'plugin-install.php?tab=plugin-information&plugin=' . rawurlencode( $app['slug'] ) ) : '',
				'learn_url'    => isset( $app['href'] ) ? (string) $app['href'] : '',
			);
		}
		return $cards;
	}

	/**
	 * Dashboard: the React page mounts here.
	 *
	 * @return void
	 */
	public static function render() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div id="reinventwp-apps-root"></div>
		<noscript><p><?php esc_html_e( 'The Reinvent WP Apps page needs JavaScript.', '{{TEXT_DOMAIN}}' ); ?></p></noscript>
		<?php
	}

	/**
	 * Menu icon: the Reinvent WP "R" in a light tint of the brand blue (#004984 is too dark
	 * on the admin sidebar). A file URL, not a data URI, so WordPress keeps the color.
	 *
	 * @return string
	 */
	private static function icon() {
		return add_query_arg( 'ver', self::HUB_VERSION, plugins_url( 'reinventwp-hub-icon.svg', __FILE__ ) );
	}

	/**
	 * Where the assistant runs: "apps" on the dashboard, the plugin's slug on the own page of
	 * a plugin that ships this class, else "" (not shown).
	 *
	 * @param string $hook Current admin page hook.
	 * @return string
	 */
	private static function bot_page( $hook ) {
		if ( 'toplevel_page_' . self::SLUG === $hook ) {
			return 'apps';
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only reads which admin page is open.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';
		if ( '' === $page ) {
			return '';
		}
		$plugins = isset( $GLOBALS['reinventwp_bot_plugins'] ) ? (array) $GLOBALS['reinventwp_bot_plugins'] : array();
		foreach ( self::catalog() as $app ) {
			if ( empty( $plugins[ $app['slug'] ] ) || empty( $app['page'] ) ) {
				continue;
			}
			parse_str( (string) wp_parse_url( $app['page'], PHP_URL_QUERY ), $args );
			if ( isset( $args['page'] ) && $args['page'] === $page ) {
				return $app['slug'];
			}
		}
		return '';
	}

	/**
	 * A bundled file's URL version: HUB_VERSION plus its build time, since the file changes
	 * with every plugin release while HUB_VERSION may not.
	 *
	 * @param string $name File name in public/hub.
	 * @return string
	 */
	private static function asset_version( $name ) {
		$file = dirname( __DIR__ ) . '/public/hub/' . $name;
		return self::HUB_VERSION . ( file_exists( $file ) ? '.' . filemtime( $file ) : '' );
	}

	/**
	 * The menu icon on every admin page (WordPress dims image menu icons, so show ours
	 * at full color, and white on the highlighted item), and, when this copy owns the
	 * menu, the React dashboard and the assistant.
	 *
	 * @param string $hook Current admin page hook.
	 * @return void
	 */
	public static function enqueue( $hook = '' ) {
		$item = '#toplevel_page_' . self::SLUG;
		wp_add_inline_style(
			'admin-menu',
			$item . ' .wp-menu-image img{width:20px;height:20px;padding:7px 0 0;opacity:1}'
			. $item . '.wp-has-current-submenu .wp-menu-image img{filter:brightness(0) invert(1)}'
		);
		if ( ! self::$owner || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$bot_page = self::bot_page( $hook );
		if ( '' !== $bot_page ) {
			// React 19 + MUI, standalone: the same assistant as on reinventwp.com.
			wp_enqueue_script( 'reinventwp-bot', plugin_dir_url( __DIR__ ) . 'public/hub/bot.js', array(), self::asset_version( 'bot.js' ), true );
			$bot = array(
				'surface'  => 'wp-admin',
				'page'     => $bot_page,
				'url'      => esc_url_raw( self::assistant_url() ),
				'apps'     => self::apps_for_page(),
				'shift'    => '#wpcontent',
				// The feedback form prefills the admin's email; nothing is sent unless they press Send.
				'feedback' => array(
					'url'    => esc_url_raw( self::feedback_url() ),
					'email'  => (string) wp_get_current_user()->user_email,
					'origin' => (string) wp_parse_url( home_url(), PHP_URL_HOST ),
				),
			);
			wp_add_inline_script( 'reinventwp-bot', 'window.reinventwpBot = ' . wp_json_encode( $bot ) . ';', 'before' );
		}
		if ( 'toplevel_page_' . self::SLUG !== $hook ) {
			return;
		}
		// Refresh button: drop the cached list so it is read again below.
		if ( isset( $_GET['refresh'], $_GET['_wpnonce'] ) && wp_verify_nonce( sanitize_key( wp_unslash( $_GET['_wpnonce'] ) ), self::REFRESH_ACTION ) ) {
			delete_transient( self::CATALOG_TRANSIENT );
		}
		// React 19 + MUI, bundled (same stack as the plugins' own admin screens).
		wp_enqueue_script( 'reinventwp-apps', plugin_dir_url( __DIR__ ) . 'public/hub/reinventwp-apps.js', array(), self::asset_version( 'reinventwp-apps.js' ), true );
		$data = array(
			'apps'        => self::apps_for_page(),
			'refresh_url' => add_query_arg(
				array(
					'refresh'  => 1,
					'_wpnonce' => wp_create_nonce( self::REFRESH_ACTION ),
				),
				admin_url( 'admin.php?page=' . self::SLUG )
			),
			'page_url'    => admin_url( 'admin.php?page=' . self::SLUG ),
		);
		wp_add_inline_script( 'reinventwp-apps', 'window.reinventwpApps = ' . wp_json_encode( $data ) . ';', 'before' );
	}
}
