<?php
/**
 * Frontend performance optimisations.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', 'bemke_college_disable_frontend_emoji_assets' );
add_filter( 'wp_get_attachment_image_attributes', 'bemke_college_tune_slider_image_loading', 20, 3 );
add_filter( 'bricks/frontend/render_element', 'bemke_college_sync_programme_images_on_mobile', 20, 2 );

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
    $attr['sizes']         = '(max-width: 767px) 100vw, 800px';

    return $attr;
}

/**
 * Let the current programme card image render at every viewport size.
 *
 * Bricks still stores older mobile-only sources for these two pictures. Remove
 * those sources from public HTML so the responsive img/srcset follows any later
 * desktop image change automatically.
 *
 * @param string $html    Rendered Bricks element HTML.
 * @param object $element Bricks element instance.
 *
 * @return string
 */
function bemke_college_sync_programme_images_on_mobile( string $html, $element ): string {
    if (
        function_exists( 'bricks_is_builder_main' ) &&
        ( bricks_is_builder_main() || bricks_is_builder_iframe() || bricks_is_builder_call() )
    ) {
        return $html;
    }

    if ( ! isset( $element->id ) || ! in_array( $element->id, array( 'nxpfdw', 'kydcmi' ), true ) ) {
        return $html;
    }

    if ( false === strpos( $html, '<picture' ) || false === strpos( $html, '<source' ) ) {
        return $html;
    }

    $updated = preg_replace( '/<source\b[^>]*>/i', '', $html );

    return null === $updated ? $html : $updated;
}
