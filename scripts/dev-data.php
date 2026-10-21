<?php
/**
 * Prints the page data (window.reinventwpApps, window.reinventwpBot) exactly as the hub class builds it,
 * for the dev server. Run through WP-CLI: see scripts/dev-data.sh.
 */
$admins = get_users( array( 'role' => 'administrator', 'number' => 1, 'fields' => 'ID' ) );
wp_set_current_user( (int) $admins[0] );
do_action( 'admin_menu' );
set_current_screen( 'toplevel_page_reinventwp-apps' );
do_action( 'admin_enqueue_scripts', 'toplevel_page_reinventwp-apps' );
foreach ( array( 'reinventwp-apps', 'reinventwp-bot' ) as $handle ) {
	$before = wp_scripts()->get_data( $handle, 'before' );
	echo is_array( $before ) ? $before[1] . "\n" : '';
}
