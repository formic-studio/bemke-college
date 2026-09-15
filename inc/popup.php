<?php
/**
 * Public popup page state.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'body_class', 'bemke_college_popup_body_class' );

/**
 * Exclude the Bricks builder canvas from frontend-only integrations.
 */
function bemke_college_is_public_request(): bool {
    if ( is_admin() ) {
        return false;
    }

    foreach ( array( 'bricks_is_builder_main', 'bricks_is_builder_iframe', 'bricks_is_builder_call' ) as $builder_check ) {
        if ( function_exists( $builder_check ) && $builder_check() ) {
            return false;
        }
    }

    return true;
}

/**
 * Show the custom popup only on the public homepage.
 */
function bemke_college_is_public_homepage(): bool {
    return is_front_page() && bemke_college_is_public_request();
}

/**
 * Apply the initial hidden state before JavaScript moves the popup to a dialog.
 *
 * @param array<int, string> $classes Existing WordPress body classes.
 * @return array<int, string>
 */
function bemke_college_popup_body_class( array $classes ): array {
    if ( bemke_college_is_public_homepage() ) {
        $classes[] = 'bemke-popup-public';
    }

    return $classes;
}
