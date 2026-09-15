<?php
/**
 * Native GetResponse form for Bemke College.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_GETRESPONSE_FORM_ID_EN = 'b2ac1302-032a-4e81-9c0f-46e8f9b223b1';
const BEMKE_COLLEGE_GETRESPONSE_EMBED_VARIANT = '0';
const BEMKE_COLLEGE_GETRESPONSE_WEB_CONNECT_URL = 'https://an.gr-wcon.com/script/9ec4bda8-b9b6-4218-b35b-940fcfff91d0/ga.js';

add_action( 'wp_head', 'bemke_college_getresponse_print_web_connect', 1 );
add_shortcode( 'bemke_college_getresponse_form', 'bemke_college_getresponse_form_shortcode' );

/**
 * Load Web Connect once on public pages so forms also work on translations.
 */
function bemke_college_getresponse_print_web_connect(): void {
    if ( ! bemke_college_is_public_request() ) {
        return;
    }
    ?>
    <link rel="preconnect" href="https://an.gr-wcon.com" crossorigin="use-credentials">
    <link rel="preconnect" href="https://ga2.getresponse.com" crossorigin="use-credentials">
    <!-- GetResponse Analytics -->
    <script type="text/javascript">
        (function(m, o, n, t, e, r, _) {
            m['__GetResponseAnalyticsObject'] = e;
            m[e] = m[e] || function() {
                (m[e].q = m[e].q || []).push(arguments);
            };
            r = o.createElement(n);
            _ = o.getElementsByTagName(n)[0];
            r.async = 1;
            r.src = t;
            r.setAttribute('crossorigin', 'use-credentials');
            _.parentNode.insertBefore(r, _);
        })(
            window,
            document,
            'script',
            <?php echo wp_json_encode( BEMKE_COLLEGE_GETRESPONSE_WEB_CONNECT_URL ); ?>,
            'GrTracking'
        );
    </script>
    <!-- End GetResponse Analytics -->
    <?php
}

/**
 * Output the requested GetResponse form at the shortcode location in Bricks.
 * GetResponse owns the fields, validation, destination list and consent.
 */
function bemke_college_getresponse_form_shortcode( $atts = array() ): string {
    $attributes = shortcode_atts(
        array( 'form_id' => BEMKE_COLLEGE_GETRESPONSE_FORM_ID_EN ),
        is_array( $atts ) ? $atts : array(),
        'bemke_college_getresponse_form'
    );
    $form_id = is_string( $attributes['form_id'] ) ? trim( $attributes['form_id'] ) : '';

    // An invalid explicit ID must never silently subscribe to the EN form.
    if ( ! preg_match( '/\A[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\z/i', $form_id ) ) {
        return '';
    }

    return sprintf(
        '<div class="bemke-college-getresponse-native-form"><getresponse-form form-id="%s" e="%s"></getresponse-form></div>',
        esc_attr( $form_id ),
        esc_attr( BEMKE_COLLEGE_GETRESPONSE_EMBED_VARIANT )
    );
}
