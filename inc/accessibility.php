<?php
/**
 * Semantic fixes for headings authored in Bricks.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

add_filter( 'bricks/frontend/render_element', 'bemke_college_fix_campus_card_headings', 30, 2 );

/**
 * The campus card titles follow an H2 section title, so they are H3s.
 * The same Bricks element IDs are used on the English and Polish pages.
 *
 * @param string $html Rendered element HTML.
 * @param object $element Bricks element instance.
 * @return string
 */
function bemke_college_fix_campus_card_headings( string $html, $element ): string {
    if (
        function_exists( 'bricks_is_builder_main' ) &&
        ( bricks_is_builder_main() || bricks_is_builder_iframe() || bricks_is_builder_call() )
    ) {
        return $html;
    }

    $heading_ids = array(
        'xgoszy', 'fdnixx', 'vwghqv', 'fgoxgd',
        'boqfqx', 'gknodi', 'gswwkl', 'pltsqh',
    );

    if ( ! isset( $element->id ) || ! in_array( $element->id, $heading_ids, true ) ) {
        return $html;
    }

    return str_ireplace( array( '<h4', '</h4>' ), array( '<h3', '</h3>' ), $html );
}
