<?php
/**
 * Published Polylang destinations for the custom Bricks language switch.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_action( 'wp_head', 'bemke_college_print_language_switch_data', 10 );

/**
 * Resolve the equivalent page, falling back to the translated homepage.
 */
function bemke_college_language_destination( string $language, int $current_id, int $front_page_id ): string {
    $candidate_id = $current_id ? (int) pll_get_post( $current_id, $language ) : 0;

    if ( ! $candidate_id && $front_page_id ) {
        $candidate_id = (int) pll_get_post( $front_page_id, $language );
    }

    if ( ! $candidate_id || 'publish' !== get_post_status( $candidate_id ) ) {
        return '';
    }

    $permalink = get_permalink( $candidate_id );

    return is_string( $permalink ) ? $permalink : '';
}

/**
 * Expose only published EN/PL destinations to the frontend module.
 */
function bemke_college_print_language_switch_data(): void {
    if (
        ! bemke_college_is_public_request() ||
        ! function_exists( 'pll_current_language' ) ||
        ! function_exists( 'pll_get_post' )
    ) {
        return;
    }

    $current_language = (string) pll_current_language( 'slug' );

    if ( ! in_array( $current_language, array( 'en', 'pl' ), true ) ) {
        return;
    }

    $queried_object = get_queried_object();
    $current_id    = $queried_object instanceof WP_Post ? (int) $queried_object->ID : 0;
    $front_page_id = (int) get_option( 'page_on_front' );
    $data          = array(
        'current' => $current_language,
        'urls'    => array(
            'en' => bemke_college_language_destination( 'en', $current_id, $front_page_id ),
            'pl' => bemke_college_language_destination( 'pl', $current_id, $front_page_id ),
        ),
    );

    echo '<script type="application/json" id="bemke-college-language-switch-data">';
    echo wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo "</script>\n";
}
