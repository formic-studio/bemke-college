<?php
/**
 * Theme setup hooks.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_action( 'after_setup_theme', 'bemke_college_setup' );

/**
 * Register child theme support.
 */
function bemke_college_setup(): void {
    load_child_theme_textdomain( 'bemke-college', get_stylesheet_directory() . '/languages' );
}
