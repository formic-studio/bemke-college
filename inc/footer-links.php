<?php
/**
 * Global footer links rendered by Bricks.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'bricks/element/render_attributes', 'bemke_college_footer_history_link', 10, 3 );

/**
 * Link the global footer's History item directly to the About history section.
 *
 * The footer is a Bricks template shared by all subpages. Its History text-link
 * currently has no link configured, so setting the root href here fixes every
 * template occurrence without duplicating page-specific links.
 *
 * @param array<string, array<string, mixed>> $attributes Element attributes.
 * @param string                             $key        Attribute group key.
 * @param object                             $element    Bricks element object.
 * @return array<string, array<string, mixed>>
 */
function bemke_college_footer_history_link( array $attributes, string $key, $element ): array {
    if (
        '_root' !== $key ||
        ! is_object( $element ) ||
        ! isset( $element->id ) ||
        'qnltnn' !== $element->id
    ) {
        return $attributes;
    }

    $history_url = home_url( '/about/' );
    if ( ! is_front_page() && function_exists( 'pll_current_language' ) && function_exists( 'pll_get_post' ) && 'pl' === pll_current_language( 'slug' ) ) {
        $about_pl = (int) pll_get_post( 921, 'pl' );
        if ( $about_pl && 'publish' === get_post_status( $about_pl ) ) {
            $history_url = get_permalink( $about_pl );
        }
    }

    $attributes[ $key ]['href'] = esc_url( $history_url . '#section_history' );

    return $attributes;
}
