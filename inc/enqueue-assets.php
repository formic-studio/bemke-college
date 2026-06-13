<?php
/**
 * Frontend asset loading for Vite builds.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_VITE_ENTRY = 'src/main.js';

add_action( 'wp_enqueue_scripts', 'bemke_college_enqueue_assets', 20 );
add_filter( 'script_loader_tag', 'bemke_college_module_script_tags', 10, 3 );

/**
 * Enqueue Vite assets from the dev server or from the production manifest.
 */
function bemke_college_enqueue_assets(): void {
    $dev_server = bemke_college_vite_dev_server();

    if ( $dev_server ) {
        wp_enqueue_script(
            'bemke-college-vite-client',
            $dev_server . '/@vite/client',
            array(),
            null,
            true
        );

        wp_enqueue_script(
            'bemke-college-main',
            $dev_server . '/' . BEMKE_COLLEGE_VITE_ENTRY,
            array( 'bemke-college-vite-client' ),
            null,
            true
        );

        return;
    }

    $manifest = bemke_college_vite_manifest();

    if ( ! isset( $manifest[ BEMKE_COLLEGE_VITE_ENTRY ] ) ) {
        return;
    }

    $entry    = $manifest[ BEMKE_COLLEGE_VITE_ENTRY ];
    $dist_uri = trailingslashit( get_stylesheet_directory_uri() ) . 'dist/';
    $dist_dir = trailingslashit( get_stylesheet_directory() ) . 'dist/';

    if ( ! empty( $entry['css'] ) && is_array( $entry['css'] ) ) {
        foreach ( $entry['css'] as $index => $css_file ) {
            wp_enqueue_style(
                'bemke-college-main-' . $index,
                $dist_uri . $css_file,
                array(),
                bemke_college_asset_version( $dist_dir . $css_file )
            );
        }
    }

    if ( empty( $entry['file'] ) ) {
        return;
    }

    wp_enqueue_script(
        'bemke-college-main',
        $dist_uri . $entry['file'],
        array(),
        bemke_college_asset_version( $dist_dir . $entry['file'] ),
        true
    );
}

/**
 * Return the configured Vite dev server URL, if enabled.
 */
function bemke_college_vite_dev_server(): string {
    if ( ! defined( 'BEMKE_COLLEGE_VITE_DEV_SERVER' ) || ! BEMKE_COLLEGE_VITE_DEV_SERVER ) {
        return '';
    }

    return untrailingslashit( (string) BEMKE_COLLEGE_VITE_DEV_SERVER );
}

/**
 * Read the Vite manifest.
 *
 * @return array<string, mixed>
 */
function bemke_college_vite_manifest(): array {
    static $manifest = null;

    if ( null !== $manifest ) {
        return $manifest;
    }

    $manifest_path = get_stylesheet_directory() . '/dist/manifest.json';

    if ( ! file_exists( $manifest_path ) ) {
        $manifest = array();

        return $manifest;
    }

    $contents = file_get_contents( $manifest_path );
    $decoded  = $contents ? json_decode( $contents, true ) : null;

    $manifest = is_array( $decoded ) ? $decoded : array();

    return $manifest;
}

/**
 * Return a stable version based on file modification time.
 */
function bemke_college_asset_version( string $path ): string {
    if ( file_exists( $path ) ) {
        return (string) filemtime( $path );
    }

    return wp_get_theme()->get( 'Version' );
}

/**
 * Mark Vite scripts as JavaScript modules.
 */
function bemke_college_module_script_tags( string $tag, string $handle, string $src ): string {
    $module_handles = array(
        'bemke-college-vite-client',
        'bemke-college-main',
    );

    if ( ! in_array( $handle, $module_handles, true ) ) {
        return $tag;
    }

    return sprintf(
        '<script type="module" src="%s" id="%s-js"></script>' . "\n",
        esc_url( $src ),
        esc_attr( $handle )
    );
}
