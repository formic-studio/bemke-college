<?php
/**
 * Instagram feed synchronization, storage, admin settings, and rendering.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN_HASH_OPTION = 'bemke_college_instagram_webhook_token_hash';
const BEMKE_COLLEGE_INSTAGRAM_FEED_LIMIT_MAX           = 12;
const BEMKE_COLLEGE_INSTAGRAM_POST_TYPE                = 'instagram_post';

add_action( 'init', 'bemke_college_register_instagram_posts_cpt' );
add_action( 'init', 'bemke_college_register_instagram_post_meta' );
add_action( 'init', 'bemke_college_register_instagram_feed_shortcode' );
add_action( 'rest_api_init', 'bemke_college_register_instagram_webhook_endpoint' );
add_action( 'admin_menu', 'bemke_college_register_instagram_settings_page' );
add_action( 'admin_init', 'bemke_college_handle_instagram_settings_save' );
add_action( 'add_meta_boxes', 'bemke_college_add_instagram_post_details_meta_box' );
add_filter( 'manage_instagram_post_posts_columns', 'bemke_college_filter_instagram_post_admin_columns' );
add_action( 'manage_instagram_post_posts_custom_column', 'bemke_college_render_instagram_post_admin_column', 10, 2 );

function bemke_college_register_instagram_posts_cpt() {
	register_post_type(
		BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
		array(
			'labels'              => array(
				'name'          => 'Posty Instagram',
				'singular_name' => 'Post Instagram',
				'add_new_item'  => 'Dodaj post Instagram',
				'edit_item'     => 'Edytuj post Instagram',
			),
			'public'              => true,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'has_archive'         => false,
			'rewrite'             => false,
			'show_in_rest'        => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'menu_icon'           => 'dashicons-instagram',
			'supports'            => array( 'title', 'editor', 'excerpt', 'thumbnail', 'custom-fields' ),
		)
	);
}

function bemke_college_register_instagram_post_meta() {
	$meta_fields = array(
		'ig_post_id'      => 'sanitize_text_field',
		'ig_post_url'     => 'esc_url_raw',
		'ig_image_url'    => 'esc_url_raw',
		'ig_permalink'    => 'esc_url_raw',
		'ig_caption'      => 'wp_kses_post',
		'ig_published_at' => 'sanitize_text_field',
		'ig_media_type'   => 'sanitize_text_field',
		'ig_attachment_id' => 'absint',
		'ig_image_download_error' => 'sanitize_text_field',
	);

	foreach ( $meta_fields as $meta_key => $sanitize_callback ) {
		register_post_meta(
			BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
			$meta_key,
			array(
				'type'              => 'ig_attachment_id' === $meta_key ? 'integer' : 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => $sanitize_callback,
				'auth_callback'     => '__return_true',
			)
		);
	}
}

function bemke_college_register_instagram_webhook_endpoint() {
	register_rest_route(
		'bemke-college/v1',
		'/instagram-post',
		array(
			'methods'             => WP_REST_Server::CREATABLE,
			'callback'            => 'bemke_college_handle_instagram_post_webhook',
			'permission_callback' => 'bemke_college_validate_instagram_webhook_token',
		)
	);
}

function bemke_college_validate_instagram_webhook_token( WP_REST_Request $request ) {
	$token = (string) $request->get_header( 'X-Secret-Token' );

	if ( '' === $token ) {
		return new WP_Error(
			'bemke_college_instagram_invalid_token',
			'Invalid Instagram webhook token.',
			array( 'status' => 403 )
		);
	}

	if ( defined( 'BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN' ) && '' !== BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN ) {
		if ( hash_equals( (string) BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN, $token ) ) {
			return true;
		}

		return new WP_Error(
			'bemke_college_instagram_invalid_token',
			'Invalid Instagram webhook token.',
			array( 'status' => 403 )
		);
	}

	$stored_token_hash = (string) get_option( BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN_HASH_OPTION, '' );

	if ( '' === $stored_token_hash ) {
		return new WP_Error(
			'bemke_college_instagram_token_missing',
			'Instagram webhook token is not configured.',
			array( 'status' => 503 )
		);
	}

	if ( ! hash_equals( $stored_token_hash, bemke_college_hash_instagram_webhook_token( $token ) ) ) {
		return new WP_Error(
			'bemke_college_instagram_invalid_token',
			'Invalid Instagram webhook token.',
			array( 'status' => 403 )
		);
	}

	return true;
}

function bemke_college_register_instagram_settings_page() {
	add_options_page(
		'Bemke College Instagram',
		'Bemke College Instagram',
		'manage_options',
		'bemke-college-instagram',
		'bemke_college_render_instagram_settings_page'
	);
}

function bemke_college_handle_instagram_settings_save() {
	if ( ! is_admin() || ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! isset( $_POST['bemke_college_instagram_settings_nonce'] ) ) {
		return;
	}

	check_admin_referer( 'bemke_college_save_instagram_settings', 'bemke_college_instagram_settings_nonce' );

	$redirect_url = add_query_arg(
		array(
			'page'                   => 'bemke-college-instagram',
			'bemke_college_instagram_saved'   => '1',
		),
		admin_url( 'options-general.php' )
	);

	if ( isset( $_POST['bemke_college_clear_instagram_token'] ) ) {
		delete_option( BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN_HASH_OPTION );
		wp_safe_redirect( $redirect_url );
		exit;
	}

	$new_token = isset( $_POST['bemke_college_instagram_webhook_token'] ) ? trim( (string) wp_unslash( $_POST['bemke_college_instagram_webhook_token'] ) ) : '';

	if ( '' !== $new_token ) {
		update_option( BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN_HASH_OPTION, bemke_college_hash_instagram_webhook_token( $new_token ), false );
	}

	wp_safe_redirect( $redirect_url );
	exit;
}

function bemke_college_render_instagram_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$has_constant_token = defined( 'BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN' ) && '' !== BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN;
	$has_option_token   = '' !== (string) get_option( BEMKE_COLLEGE_INSTAGRAM_WEBHOOK_TOKEN_HASH_OPTION, '' );
	$endpoint_url       = rest_url( 'bemke-college/v1/instagram-post' );
	$token_label = $has_option_token ? str_repeat( '*', 24 ) : '';
	?>
	<div class="wrap">
		<h1>Bemke College Instagram</h1>

		<?php if ( isset( $_GET['bemke_college_instagram_saved'] ) ) : ?>
			<div class="notice notice-success is-dismissible">
				<p>Ustawienia Instagrama zostały zapisane.</p>
			</div>
		<?php endif; ?>

		<p>Ten panel obsługuje webhook z Make. Token nie jest zapisywany jawnie w bazie, tylko jako hash.</p>

		<table class="form-table" role="presentation">
			<tr>
				<th scope="row">Endpoint dla Make</th>
				<td><code><?php echo esc_html( $endpoint_url ); ?></code></td>
			</tr>
			<tr>
				<th scope="row">Status tokenu</th>
				<td>
					<?php if ( $has_constant_token ) : ?>
						Token jest ustawiony w <code>wp-config.php</code>.
					<?php elseif ( $has_option_token ) : ?>
						Token jest ustawiony w panelu WordPress.
					<?php else : ?>
						Token nie jest jeszcze ustawiony.
					<?php endif; ?>
				</td>
			</tr>
		</table>

		<form method="post" action="">
			<?php wp_nonce_field( 'bemke_college_save_instagram_settings', 'bemke_college_instagram_settings_nonce' ); ?>

			<table class="form-table" role="presentation">
				<tr>
					<th scope="row">
						<label for="bemke_college_instagram_webhook_token">Nowy token webhooka</label>
					</th>
					<td>
						<input
							type="password"
							id="bemke_college_instagram_webhook_token"
							name="bemke_college_instagram_webhook_token"
							class="regular-text"
							value=""
							placeholder="<?php echo esc_attr( $token_label ); ?>"
							autocomplete="new-password"
						>
						<p class="description">Wklej ten sam token, który potem ustawisz w Make jako nagłówek <code>X-Secret-Token</code>.</p>
					</td>
				</tr>
			</table>

			<?php submit_button( 'Zapisz token' ); ?>

			<?php if ( ! $has_constant_token && $has_option_token ) : ?>
				<p>
					<button type="submit" name="bemke_college_clear_instagram_token" value="1" class="button button-secondary">
						Usuń token
					</button>
				</p>
			<?php endif; ?>
		</form>
	</div>
	<?php
}

function bemke_college_hash_instagram_webhook_token( $token ) {
	return hash_hmac( 'sha256', (string) $token, wp_salt( 'auth' ) );
}

function bemke_college_handle_instagram_post_webhook( WP_REST_Request $request ) {
	$body = $request->get_json_params();

	if ( ! is_array( $body ) ) {
		$body = $request->get_body_params();
	}

	if ( ! is_array( $body ) || empty( $body ) ) {
		$body = $request->get_params();
	}

	if ( ! is_array( $body ) || empty( $body ) ) {
		return new WP_Error(
			'bemke_college_instagram_invalid_payload',
			'Invalid request payload.',
			array( 'status' => 400 )
		);
	}

	$items = bemke_college_get_instagram_payload_items( $body );

	if ( empty( $items ) ) {
		return new WP_Error(
			'bemke_college_instagram_invalid_payload',
			'Invalid payload format. Send one post object or array of posts.',
			array( 'status' => 400 )
		);
	}

	$created  = 0;
	$updated  = 0;
	$skipped  = 0;
	$processed = 0;

	foreach ( $items as $item ) {
		if ( ! is_array( $item ) ) {
			$skipped++;
			continue;
		}

		$normalized = bemke_college_normalize_instagram_payload_item( $item );

		if ( '' === $normalized['post_id'] || '' === $normalized['media_url'] || '' === $normalized['permalink'] ) {
			$skipped++;
			continue;
		}

		$result = bemke_college_upsert_instagram_post( $normalized );

		if ( ! is_array( $result ) || empty( $result['wp_post_id'] ) ) {
			$skipped++;
			continue;
		}

		if ( 'created' === $result['status'] ) {
			$created++;
		} else {
			$updated++;
		}

		$processed++;
	}

	bemke_college_trim_instagram_posts_to_limit( BEMKE_COLLEGE_INSTAGRAM_FEED_LIMIT_MAX );

	return new WP_REST_Response(
		array(
			'status'    => 'ok',
			'created'   => $created,
			'updated'   => $updated,
			'skipped'   => $skipped,
			'processed' => $processed,
		),
		200
	);
}

function bemke_college_get_instagram_payload_items( array $body ) {
	if ( isset( $body['items'] ) && is_array( $body['items'] ) ) {
		return $body['items'];
	}

	if ( isset( $body['posts'] ) && is_array( $body['posts'] ) ) {
		return $body['posts'];
	}

	if ( bemke_college_is_instagram_payload_item( $body ) ) {
		return array( $body );
	}

	return array();
}

function bemke_college_is_instagram_payload_item( array $item ) {
	return isset( $item['id'] ) || isset( $item['post_id'] ) || isset( $item['permalink'] ) || isset( $item['media_url'] );
}

function bemke_college_normalize_instagram_payload_item( array $item ) {
	$post_id   = (string) bemke_college_get_array_value( $item, array( 'id', 'post_id', 'media_id', 'ig_post_id' ) );
	$caption   = (string) bemke_college_get_array_value( $item, array( 'caption', 'text', 'description', 'message', 'post_text', 'commentary' ) );
	$media_url = (string) bemke_college_get_array_value( $item, array( 'media_url', 'mediaUrl', 'image_url', 'imageUrl', 'image' ) );
	$permalink = (string) bemke_college_get_array_value( $item, array( 'permalink', 'url', 'post_url', 'content_landing_page' ) );
	$media_type = (string) bemke_college_get_array_value( $item, array( 'media_type', 'mediaType', 'type' ) );
	$thumbnail_url = (string) bemke_college_get_array_value( $item, array( 'thumbnail_url', 'thumbnailUrl', 'thumbnail' ) );
	$published_at = (string) bemke_college_get_array_value(
		$item,
		array(
			'published_at',
			'publishedAt',
			'created_at',
			'createdAt',
			'published_time',
			'publishedTime',
		)
	);
	$media_url_is_image = '' !== $media_url && (bool) preg_match( '/\.(jpe?g|png|gif|webp)(?:\?|$)/i', $media_url );

	if (
		'' !== $thumbnail_url
		&& (
			'' === $media_url
			|| ! $media_url_is_image
			|| in_array( strtoupper( $media_type ), array( 'VIDEO', 'CAROUSEL_ALBUM' ), true )
		)
	) {
		$media_url = $thumbnail_url;
	}

	if ( '' === $media_url && isset( $item['children'] ) && is_array( $item['children'] ) ) {
		$children = $item['children'];

		if ( isset( $children['data'] ) && is_array( $children['data'] ) ) {
			$children = $children['data'];
		}

		foreach ( $children as $child ) {
			if ( ! is_array( $child ) ) {
				continue;
			}

			$media_url = (string) bemke_college_get_array_value(
				$child,
				array( 'media_url', 'mediaUrl', 'image_url', 'imageUrl', 'thumbnail_url', 'thumbnailUrl' )
			);

			if ( '' !== $media_url ) {
				break;
			}
		}
	}

	return array(
		'post_id'     => sanitize_text_field( $post_id ),
		'caption'     => sanitize_textarea_field( $caption ),
		'media_url'   => esc_url_raw( $media_url ),
		'permalink'   => esc_url_raw( $permalink ),
		'media_type'  => sanitize_text_field( strtoupper( $media_type ) ),
		'published_at' => sanitize_text_field( $published_at ),
	);
}

function bemke_college_upsert_instagram_post( array $data ) {
	$post_id = $data['post_id'];
	$title   = bemke_college_get_instagram_post_title( $data['caption'], $data['published_at'] );
	$excerpt = wp_trim_words( wp_strip_all_tags( $data['caption'] ), 24, '...' );
	$dates   = bemke_college_parse_instagram_post_dates( $data['published_at'] );
	$existing = bemke_college_get_instagram_post_id_by_remote_id( $post_id );

	$post_data = array(
		'post_type'    => BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
		'post_title'   => $title,
		'post_content' => $data['caption'],
		'post_excerpt' => $excerpt,
		'post_status'  => 'publish',
	);

	if ( $dates['post_date'] && $dates['post_date_gmt'] ) {
		$post_data['post_date']     = $dates['post_date'];
		$post_data['post_date_gmt'] = $dates['post_date_gmt'];
	}

	if ( $existing ) {
		$post_data['ID'] = $existing;
		$wp_post_id     = wp_update_post( $post_data, true );
		$status         = 'updated';
	} else {
		$wp_post_id = wp_insert_post( $post_data, true );
		$status    = 'created';
	}

	if ( is_wp_error( $wp_post_id ) ) {
		return null;
	}

	update_post_meta( $wp_post_id, 'ig_post_id', $post_id );
	update_post_meta( $wp_post_id, 'ig_post_url', $data['permalink'] );
	update_post_meta( $wp_post_id, 'ig_image_url', $data['media_url'] );
	update_post_meta( $wp_post_id, 'ig_permalink', $data['permalink'] );
	update_post_meta( $wp_post_id, 'ig_caption', $data['caption'] );
	update_post_meta( $wp_post_id, 'ig_published_at', $data['published_at'] );
	update_post_meta( $wp_post_id, 'ig_media_type', $data['media_type'] );

	$attachment_id = bemke_college_maybe_sideload_instagram_image( $wp_post_id, $data );

	if ( $attachment_id ) {
		update_post_meta( $wp_post_id, 'ig_attachment_id', $attachment_id );
	}

	return array(
		'status'     => $status,
		'wp_post_id' => (int) $wp_post_id,
	);
}

function bemke_college_maybe_sideload_instagram_image( $wp_post_id, array $data ) {
	$media_url = isset( $data['media_url'] ) ? esc_url_raw( $data['media_url'] ) : '';

	if ( '' === $media_url ) {
		return 0;
	}

	$existing_attachment_id = absint( get_post_meta( $wp_post_id, 'ig_attachment_id', true ) );

	if ( ! $existing_attachment_id ) {
		$existing_attachment_id = absint( get_post_thumbnail_id( $wp_post_id ) );
	}

	if ( $existing_attachment_id && 'attachment' === get_post_type( $existing_attachment_id ) ) {
		set_post_thumbnail( $wp_post_id, $existing_attachment_id );
		return $existing_attachment_id;
	}

	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$description = wp_strip_all_tags( $data['caption'] );

	if ( '' === $description ) {
		$description = get_the_title( $wp_post_id );
	}

	$attachment_id = media_sideload_image( $media_url, $wp_post_id, $description, 'id' );

	if ( is_wp_error( $attachment_id ) ) {
		update_post_meta( $wp_post_id, 'ig_image_download_error', $attachment_id->get_error_message() );
		return 0;
	}

	delete_post_meta( $wp_post_id, 'ig_image_download_error' );
	set_post_thumbnail( $wp_post_id, $attachment_id );

	return absint( $attachment_id );
}

function bemke_college_get_array_value( array $data, array $keys, $default = '' ) {
	foreach ( $keys as $key ) {
		if ( ! isset( $data[ $key ] ) ) {
			continue;
		}

		return $data[ $key ];
	}

	return $default;
}

function bemke_college_instagram_feed_language() {
	if ( function_exists( 'pll_current_language' ) ) {
		$language = pll_current_language( 'slug' );

		if ( is_string( $language ) && '' !== $language ) {
			return $language;
		}
	}

	$locale = function_exists( 'determine_locale' ) ? determine_locale() : get_locale();

	return 0 === strpos( strtolower( (string) $locale ), 'en' ) ? 'en' : 'pl';
}

/**
 * Register the optional manual-rendering shortcode.
 */
function bemke_college_register_instagram_feed_shortcode() {
	add_shortcode( 'bemke_college_instagram_feed', 'bemke_college_render_instagram_feed_shortcode' );
}

function bemke_college_render_instagram_feed_shortcode( $atts = array() ) {
	$atts = shortcode_atts(
		array(
			'limit'        => 8,
			'columns'      => 4,
			'class'        => 'bemke-instagram-feed',
		),
		$atts,
		'bemke_college_instagram_feed'
	);

	$limit   = min( max( 1, absint( $atts['limit'] ) ), BEMKE_COLLEGE_INSTAGRAM_FEED_LIMIT_MAX );
	$columns = min( max( 2, absint( $atts['columns'] ) ), 6 );
	$class   = sanitize_html_class( (string) $atts['class'] );

	$posts = bemke_college_get_instagram_feed_posts( $limit );

	if ( empty( $posts ) ) {
		return current_user_can( 'manage_options' )
			? '<p class="bemke-instagram-feed__error">' . ( 'en' === bemke_college_instagram_feed_language() ? 'No Instagram posts yet (waiting for data from Make).' : 'Brak postów z Instagrama (oczekuję danych z Make).' ) . '</p>'
			: '';
	}

	$container_id = uniqid( 'bemke-instagram-feed-' );
	$grid_style   = sprintf( 'style="--bemke-instagram-columns:%1$d"', absint( $columns ) );
	$output       = '';

	$output .= sprintf( '<section class="%1$s" id="%2$s">', esc_attr( $class ), esc_attr( $container_id ) );
	$output .= '<div class="bemke-instagram-feed__grid" ' . $grid_style . '>';

	foreach ( $posts as $post ) {
		if ( empty( $post['permalink'] ) || empty( $post['media_url'] ) ) {
			continue;
		}

		$caption       = isset( $post['caption'] ) ? sanitize_text_field( (string) $post['caption'] ) : '';
		$image_alt     = '' !== $caption ? wp_strip_all_tags( $caption ) : ( 'en' === bemke_college_instagram_feed_language() ? 'Instagram post' : 'Post z Instagrama' );
		$media_caption = wp_trim_words( $image_alt, 8, '...' );

		$output .= sprintf(
			'<a class="bemke-instagram-feed__item" href="%1$s" target="_blank" rel="noopener noreferrer" aria-label="%2$s">
				<img loading="lazy" src="%3$s" alt="%2$s">
			</a>',
			esc_url( $post['permalink'] ),
			esc_attr( $media_caption ),
			esc_url( $post['media_url'] )
		);
	}

	$output .= '</div>';
	$output .= '</section>';

	return $output;
}

function bemke_college_get_instagram_feed_posts( $limit = 8 ) {
	$limit = min( max( 1, absint( $limit ) ), BEMKE_COLLEGE_INSTAGRAM_FEED_LIMIT_MAX );
	$query = new WP_Query(
		array(
			'post_type'              => BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
			'post_status'            => 'publish',
			'posts_per_page'         => $limit,
			'orderby'                => 'date',
			'order'                  => 'DESC',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	if ( ! $query->have_posts() ) {
		return array();
	}

	$posts = array();

	while ( $query->have_posts() ) {
		$query->the_post();

		$attachment_id = absint( get_post_meta( get_the_ID(), 'ig_attachment_id', true ) );
		$media_url     = $attachment_id ? (string) wp_get_attachment_image_url( $attachment_id, 'large' ) : '';

		if ( '' === $media_url ) {
			$media_url = (string) get_post_meta( get_the_ID(), 'ig_image_url', true );
		}

		if ( '' === $media_url ) {
			continue;
		}

		$posts[] = array(
			'id'         => (string) get_the_ID(),
			'permalink'  => (string) get_post_meta( get_the_ID(), 'ig_permalink', true ),
			'media_url'  => $media_url,
			'caption'    => (string) get_post_meta( get_the_ID(), 'ig_caption', true ),
			'media_type' => (string) get_post_meta( get_the_ID(), 'ig_media_type', true ),
		);

		if ( count( $posts ) >= $limit ) {
			break;
		}
	}

	wp_reset_postdata();

	return $posts;
}

function bemke_college_get_instagram_post_id_by_remote_id( $remote_post_id ) {
	$posts = get_posts(
		array(
			'post_type'              => BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
			'post_status'            => 'any',
			'fields'                 => 'ids',
			'numberposts'            => 1,
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'meta_key'               => 'ig_post_id',
			'meta_value'             => $remote_post_id,
		)
	);

	return empty( $posts ) ? 0 : (int) $posts[0];
}

function bemke_college_parse_instagram_post_dates( $published_at ) {
	if ( '' === $published_at ) {
		return array(
			'post_date'     => null,
			'post_date_gmt' => null,
		);
	}

	$timestamp = strtotime( $published_at );

	if ( false === $timestamp ) {
		return array(
			'post_date'     => null,
			'post_date_gmt' => null,
		);
	}

	$post_date_gmt = gmdate( 'Y-m-d H:i:s', $timestamp );

	return array(
		'post_date'     => get_date_from_gmt( $post_date_gmt ),
		'post_date_gmt' => $post_date_gmt,
	);
}

function bemke_college_get_instagram_post_title( $post_text, $published_at ) {
	$title = wp_trim_words( wp_strip_all_tags( $post_text ), 10, '...' );

	if ( '' !== $title ) {
		return $title;
	}

	if ( '' !== $published_at ) {
		return sprintf( 'Post Instagram - %s', $published_at );
	}

	return 'Post Instagram';
}

function bemke_college_add_instagram_post_details_meta_box() {
	add_meta_box(
		'bemke_college_instagram_post_details',
		'Dane Instagram',
		'bemke_college_render_instagram_post_details_meta_box',
		BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
		'side',
		'default'
	);
}

function bemke_college_render_instagram_post_details_meta_box( WP_Post $post ) {
	$attachment_id = absint( get_post_meta( $post->ID, 'ig_attachment_id', true ) );
	$fields = array(
		'ID posta'        => get_post_meta( $post->ID, 'ig_post_id', true ),
		'URL posta'       => get_post_meta( $post->ID, 'ig_permalink', true ),
		'URL media'       => get_post_meta( $post->ID, 'ig_image_url', true ),
		'ID załącznika'   => $attachment_id,
		'Błąd pobierania' => get_post_meta( $post->ID, 'ig_image_download_error', true ),
		'Data z IG'       => get_post_meta( $post->ID, 'ig_published_at', true ),
		'Typ media'       => get_post_meta( $post->ID, 'ig_media_type', true ),
		'Link do posta'   => get_post_meta( $post->ID, 'ig_post_url', true ),
	);

	?>
	<div class="bemke-instagram-post-details">
		<?php if ( $attachment_id ) : ?>
			<p>
				<?php
				echo wp_get_attachment_image(
					$attachment_id,
					'medium',
					false,
					array(
						'style' => 'max-width:100%;height:auto;display:block;',
					)
				);
				?>
			</p>
		<?php endif; ?>

		<?php foreach ( $fields as $label => $value ) : ?>
			<p>
				<strong><?php echo esc_html( $label ); ?>:</strong><br>
				<?php if ( '' === (string) $value || '0' === (string) $value ) : ?>
					<span aria-hidden="true">-</span>
				<?php elseif ( 0 === strpos( (string) $value, 'http' ) ) : ?>
					<a href="<?php echo esc_url( $value ); ?>" target="_blank" rel="noopener noreferrer">
						<?php echo esc_html( $value ); ?>
					</a>
				<?php else : ?>
					<code><?php echo esc_html( $value ); ?></code>
				<?php endif; ?>
			</p>
		<?php endforeach; ?>
	</div>
	<?php
}

function bemke_college_filter_instagram_post_admin_columns( $columns ) {
	$new_columns = array();

	foreach ( $columns as $key => $label ) {
		$new_columns[ $key ] = $label;

		if ( 'title' === $key ) {
			$new_columns['bemke_college_instagram_post_url'] = 'Link Instagram';
			$new_columns['bemke_college_instagram_post_id']  = 'ID Instagram';
		}
	}

	return $new_columns;
}

function bemke_college_render_instagram_post_admin_column( $column, $post_id ) {
	if ( 'bemke_college_instagram_post_url' === $column ) {
		$post_url = get_post_meta( $post_id, 'ig_permalink', true );

		if ( '' === $post_url ) {
			echo '<span aria-hidden="true">-</span>';
			return;
		}

		printf(
			'<a href="%s" target="_blank" rel="noopener noreferrer">Otwórz</a>',
			esc_url( $post_url )
		);
		return;
	}

	if ( 'bemke_college_instagram_post_id' === $column ) {
		$remote_id = get_post_meta( $post_id, 'ig_post_id', true );
		echo '' === $remote_id ? '<span aria-hidden="true">-</span>' : '<code>' . esc_html( $remote_id ) . '</code>';
	}
}

function bemke_college_trim_instagram_posts_to_limit( $limit ) {
	$limit = max( 1, absint( $limit ) );

	$all_posts = get_posts(
		array(
			'post_type'              => BEMKE_COLLEGE_INSTAGRAM_POST_TYPE,
			'post_status'            => 'any',
			'fields'                 => 'ids',
			'numberposts'            => -1,
			'no_found_rows'          => true,
			'orderby'                => 'date',
			'order'                  => 'DESC',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	if ( count( $all_posts ) <= $limit ) {
		return;
	}

	$to_delete = array_slice( $all_posts, $limit );

	foreach ( $to_delete as $post_id ) {
		wp_delete_post( (int) $post_id, true );
	}
}


