<?php
/**
 * Frontend asset loading for Vite builds.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_VITE_ENTRY = 'src/main.js';

add_action( 'wp_enqueue_scripts', 'bemke_college_enqueue_assets', 20 );
add_action( 'wp_head', 'bemke_college_preload_critical_fonts', 2 );
add_action( 'wp_head', 'bemke_college_prepare_hero_intro', 3 );
add_filter( 'script_loader_tag', 'bemke_college_module_script_tags', 10, 3 );

/**
 * Prevent a flash of the final hero text before the intro module is ready.
 */
function bemke_college_prepare_hero_intro(): void {
	wp_print_inline_script_tag(
		<<<'JS'
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    if (localStorage.getItem('bemke_a11y_reduce_motion') === 'true') return;
  } catch {
    // The system preference also applies when storage is unavailable.
  }

  const root = document.documentElement;
  root.setAttribute('data-bemke-hero-pending', '');
  window.setTimeout(() => root.removeAttribute('data-bemke-hero-pending'), 850);
})();
JS
	);
}

/**
 * Preload the two fonts used in the first viewport.
 *
 * Bricks defines the font faces in its inline CSS, but without preload the
 * browser discovers their files only after it has parsed that CSS and laid out
 * the first text. On a cold cache that produces a visible fallback-font swap.
 */
function bemke_college_preload_critical_fonts(): void {
    $uploads = wp_get_upload_dir();

    if ( ! empty( $uploads['error'] ) || empty( $uploads['baseurl'] ) ) {
        return;
    }

    $font_base = trailingslashit( $uploads['baseurl'] ) . '2026/06/';
    $fonts     = array(
        'SeasonSans-Regular.woff2',
        'SeasonMix-RegularItalic.woff2',
    );

    foreach ( $fonts as $font ) {
        printf(
            '<link rel="preload" href="%s" as="font" type="font/woff2" crossorigin>' . "\n",
            esc_url( $font_base . $font )
        );
    }
}

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
            false
        );

        wp_enqueue_script(
            'bemke-college-main',
            $dev_server . '/' . BEMKE_COLLEGE_VITE_ENTRY,
            array( 'bemke-college-vite-client' ),
            null,
            false
        );

        return;
    }

    $manifest = bemke_college_vite_manifest();

    if ( ! isset( $manifest[ BEMKE_COLLEGE_VITE_ENTRY ] ) ) {
        return;
    }

    $entry    = $manifest[ BEMKE_COLLEGE_VITE_ENTRY ];
    $dist_uri = trailingslashit( get_stylesheet_directory_uri() ) . 'dist/';

    if ( ! empty( $entry['css'] ) && is_array( $entry['css'] ) ) {
        foreach ( $entry['css'] as $index => $css_file ) {
            wp_enqueue_style(
                'bemke-college-main-' . $index,
                $dist_uri . $css_file,
                array(),
                null
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
        null,
        false
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
 * Mark Vite scripts as JavaScript modules.
 */
function bemke_college_module_script_tags( string $tag, string $handle, string $src ): string {
    $module_handles = array(
        'bemke-college-vite-client',
        'bemke-college-main',
        'bemke-college-qa-admin',
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
