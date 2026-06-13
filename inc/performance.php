<?php
/**
 * Frontend performance optimisations.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'bemke_college_disable_frontend_emoji_assets' );
add_filter( 'wp_get_attachment_image_attributes', 'bemke_college_tune_slider_image_loading', 20, 3 );

/**
 * Remove WordPress emoji assets from the public frontend.
 */
function bemke_college_disable_frontend_emoji_assets(): void {
    if ( is_admin() ) {
        return;
    }

    remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
    remove_action( 'wp_print_styles', 'print_emoji_styles' );
    remove_action( 'wp_print_footer_scripts', 'print_emoji_detection_script' );

    remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
    remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
    remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );

    add_filter( 'emoji_svg_url', '__return_false' );
}

/**
 * Keep below-the-fold Bricks slider images from competing with critical assets.
 *
 * @param array<string, string> $attr Attachment image attributes.
 * @param WP_Post              $attachment Attachment post object.
 * @param string|int[]         $size Requested image size.
 *
 * @return array<string, string>
 */
function bemke_college_tune_slider_image_loading( array $attr, WP_Post $attachment, $size ): array {
    if ( empty( $attr['class'] ) || false === strpos( $attr['class'], 'slider-img' ) ) {
        return $attr;
    }

    $attr['loading']       = 'lazy';
    $attr['decoding']      = 'async';
    $attr['fetchpriority'] = 'low';

    return $attr;
}
