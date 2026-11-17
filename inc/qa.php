<?php
/**
 * Native Q&A sets, page assignment, admin editing, and frontend rendering.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_QA_POST_TYPE        = 'bemke_qa';
const BEMKE_COLLEGE_QA_DATA_META        = '_bemke_college_qa_data';
const BEMKE_COLLEGE_QA_PAGE_SET_META    = '_bemke_college_qa_set_id';
const BEMKE_COLLEGE_QA_NONCE_ACTION     = 'bemke_college_save_qa';
const BEMKE_COLLEGE_QA_NONCE_NAME       = 'bemke_college_qa_nonce';
const BEMKE_COLLEGE_QA_PAGE_NONCE_ACTION = 'bemke_college_assign_qa';
const BEMKE_COLLEGE_QA_PAGE_NONCE_NAME   = 'bemke_college_qa_page_nonce';

add_action( 'init', 'bemke_college_register_qa_post_type' );
add_action( 'init', 'bemke_college_register_qa_meta' );
add_action( 'init', 'bemke_college_register_qa_shortcode' );
add_action( 'add_meta_boxes', 'bemke_college_add_qa_meta_boxes' );
add_action( 'save_post_' . BEMKE_COLLEGE_QA_POST_TYPE, 'bemke_college_save_qa_set' );
add_action( 'save_post_page', 'bemke_college_save_page_qa_assignment' );
add_action( 'admin_enqueue_scripts', 'bemke_college_enqueue_qa_admin_assets' );
add_filter( 'use_block_editor_for_post_type', 'bemke_college_disable_qa_block_editor', 10, 2 );
add_filter( 'enter_title_here', 'bemke_college_qa_title_placeholder', 10, 2 );
add_filter( 'manage_' . BEMKE_COLLEGE_QA_POST_TYPE . '_posts_columns', 'bemke_college_qa_admin_columns' );
add_action( 'manage_' . BEMKE_COLLEGE_QA_POST_TYPE . '_posts_custom_column', 'bemke_college_render_qa_admin_column', 10, 2 );
add_filter( 'manage_pages_columns', 'bemke_college_page_qa_admin_column' );
add_action( 'manage_pages_custom_column', 'bemke_college_render_page_qa_admin_column', 10, 2 );
add_filter( 'pll_copy_post_metas', 'bemke_college_exclude_qa_assignment_from_polylang_sync', 10, 5 );

/**
 * Register the private Q&A set content type.
 */
function bemke_college_register_qa_post_type(): void {
	register_post_type(
		BEMKE_COLLEGE_QA_POST_TYPE,
		array(
			'labels'              => array(
				'name'                  => 'Q&A',
				'singular_name'         => 'Zestaw Q&A',
				'menu_name'             => 'Q&A',
				'add_new'               => 'Dodaj zestaw',
				'add_new_item'          => 'Dodaj zestaw Q&A',
				'edit_item'             => 'Edytuj zestaw Q&A',
				'new_item'              => 'Nowy zestaw Q&A',
				'view_item'             => 'Zobacz zestaw Q&A',
				'search_items'          => 'Szukaj zestawów Q&A',
				'not_found'             => 'Nie znaleziono zestawów Q&A.',
				'not_found_in_trash'    => 'Brak zestawów Q&A w koszu.',
				'all_items'             => 'Wszystkie zestawy',
				'item_published'        => 'Zestaw Q&A został opublikowany.',
				'item_updated'          => 'Zestaw Q&A został zaktualizowany.',
			),
			'public'              => false,
			'publicly_queryable'  => false,
			'exclude_from_search' => true,
			'show_ui'             => true,
			'show_in_menu'        => true,
			'show_in_rest'        => false,
			'has_archive'         => false,
			'rewrite'             => false,
			'menu_icon'           => 'dashicons-editor-help',
			'menu_position'       => 21,
			'supports'            => array( 'title', 'revisions' ),
			'capability_type'     => 'page',
			'map_meta_cap'        => true,
		)
	);
}

/**
 * Register stored Q&A data and the page-to-set relationship.
 */
function bemke_college_register_qa_meta(): void {
	register_post_meta(
		BEMKE_COLLEGE_QA_POST_TYPE,
		BEMKE_COLLEGE_QA_DATA_META,
		array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => false,
			'sanitize_callback' => 'bemke_college_sanitize_qa_json_meta',
			'auth_callback'     => static function (): bool {
				return current_user_can( 'edit_pages' );
			},
			'revisions_enabled' => true,
		)
	);

	register_post_meta(
		'page',
		BEMKE_COLLEGE_QA_PAGE_SET_META,
		array(
			'type'              => 'integer',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => 'absint',
			'auth_callback'     => static function (): bool {
				return current_user_can( 'edit_pages' );
			},
			'revisions_enabled' => true,
		)
	);

}

/**
 * Keep EN and PL page assignments independent when Polylang meta sync is on.
 *
 * @param array<int, string> $metas Meta keys selected by Polylang.
 * @return array<int, string>
 */
function bemke_college_exclude_qa_assignment_from_polylang_sync( array $metas ): array {
	return array_values(
		array_diff(
			$metas,
			array(
				BEMKE_COLLEGE_QA_PAGE_SET_META,
			)
		)
	);
}

/**
 * Keep only valid JSON in the registered meta field.
 */
function bemke_college_sanitize_qa_json_meta( $value ): string {
	if ( ! is_string( $value ) ) {
		return '';
	}

	$decoded = json_decode( $value, true );

	return is_array( $decoded ) ? $value : '';
}

/**
 * Use the classic edit screen because the Q&A UI is a purpose-built meta box.
 */
function bemke_college_disable_qa_block_editor( bool $use_block_editor, string $post_type ): bool {
	return BEMKE_COLLEGE_QA_POST_TYPE === $post_type ? false : $use_block_editor;
}

/**
 * Explain that the WordPress title is an internal set label.
 */
function bemke_college_qa_title_placeholder( string $placeholder, WP_Post $post ): string {
	if ( BEMKE_COLLEGE_QA_POST_TYPE === $post->post_type ) {
		return 'Nazwa administracyjna, np. Scholarships EN';
	}

	return $placeholder;
}

/**
 * Register the editor and page assignment boxes.
 */
function bemke_college_add_qa_meta_boxes(): void {
	add_meta_box(
		'bemke-college-qa-content',
		'Treść i wariant Q&A',
		'bemke_college_render_qa_editor_meta_box',
		BEMKE_COLLEGE_QA_POST_TYPE,
		'normal',
		'high'
	);

	add_meta_box(
		'bemke-college-page-qa',
		'Q&A',
		'bemke_college_render_page_qa_meta_box',
		'page',
		'side',
		'default'
	);
}

/**
 * Return the default editor data shape.
 *
 * @return array<string, mixed>
 */
function bemke_college_default_qa_data(): array {
	return array(
		'version'      => 1,
		'heading'      => 'Q&A',
		'variant'      => 'plain',
		'open_first'   => true,
		'plain_items'  => array(),
		'categories'   => array(),
	);
}

/**
 * Read and normalize one stored set.
 *
 * @return array<string, mixed>
 */
function bemke_college_get_qa_data( int $post_id ): array {
	$defaults = bemke_college_default_qa_data();
	$json     = (string) get_post_meta( $post_id, BEMKE_COLLEGE_QA_DATA_META, true );
	$decoded  = $json ? json_decode( $json, true ) : null;

	if ( ! is_array( $decoded ) ) {
		return $defaults;
	}

	$data                  = wp_parse_args( $decoded, $defaults );
	$data['variant']       = 'categorized' === $data['variant'] ? 'categorized' : 'plain';
	$data['open_first']    = ! empty( $data['open_first'] );
	$data['plain_items']   = is_array( $data['plain_items'] ) ? array_values( $data['plain_items'] ) : array();
	$data['categories']    = is_array( $data['categories'] ) ? array_values( $data['categories'] ) : array();

	return $data;
}

/**
 * Render the complete native Q&A editor.
 */
function bemke_college_render_qa_editor_meta_box( WP_Post $post ): void {
	$data = bemke_college_get_qa_data( $post->ID );

	wp_nonce_field( BEMKE_COLLEGE_QA_NONCE_ACTION, BEMKE_COLLEGE_QA_NONCE_NAME );
	?>
	<div class="bemke-qa-admin" data-bemke-qa-admin>
		<p class="description bemke-qa-admin__intro">
			Nazwa wpisu powyżej służy tylko do rozpoznawania zestawu w panelu. Widoczny nagłówek oraz treść ustawisz tutaj.
		</p>

		<div class="bemke-qa-admin__settings">
			<label class="bemke-qa-admin__field">
				<span>Widoczny nagłówek sekcji</span>
				<input type="text" name="bemke_college_qa_data[heading]" value="<?php echo esc_attr( (string) $data['heading'] ); ?>" placeholder="Q&amp;A">
			</label>

			<fieldset class="bemke-qa-admin__field">
				<legend>Wariant sekcji</legend>
				<label>
					<input type="radio" name="bemke_college_qa_data[variant]" value="plain" <?php checked( 'plain', $data['variant'] ); ?>>
					Bez kategorii
				</label>
				<label>
					<input type="radio" name="bemke_college_qa_data[variant]" value="categorized" <?php checked( 'categorized', $data['variant'] ); ?>>
					Z kategoriami
				</label>
			</fieldset>

			<label class="bemke-qa-admin__checkbox">
				<input type="checkbox" name="bemke_college_qa_data[open_first]" value="1" <?php checked( ! empty( $data['open_first'] ) ); ?>>
				Pierwsze pytanie ma być domyślnie otwarte
			</label>
		</div>

		<section class="bemke-qa-admin__variant" data-qa-variant-panel="plain" <?php echo 'plain' === $data['variant'] ? '' : 'hidden'; ?>>
			<div class="bemke-qa-admin__section-heading">
				<div>
					<h3>Pytania</h3>
					<p>Przeciągnij wiersze za uchwyt, aby zmienić kolejność.</p>
				</div>
				<button type="button" class="button button-primary" data-qa-add-item data-target="bemke-qa-plain-items" data-prefix="bemke_college_qa_data[plain_items]">Dodaj pytanie</button>
			</div>

			<div id="bemke-qa-plain-items" class="bemke-qa-admin__items" data-qa-sortable-items>
				<?php
				foreach ( $data['plain_items'] as $index => $item ) {
					bemke_college_render_qa_admin_item( $item, 'bemke_college_qa_data[plain_items]', 'plain-' . $index );
				}
				?>
			</div>
		</section>

		<section class="bemke-qa-admin__variant" data-qa-variant-panel="categorized" <?php echo 'categorized' === $data['variant'] ? '' : 'hidden'; ?>>
			<div class="bemke-qa-admin__section-heading">
				<div>
					<h3>Kategorie i pytania</h3>
					<p>Kolejność kategorii i pytań można zmieniać przeciąganiem.</p>
				</div>
				<button type="button" class="button button-primary" data-qa-add-category>Dodaj kategorię</button>
			</div>

			<div class="bemke-qa-admin__categories" data-qa-categories>
				<?php
				foreach ( $data['categories'] as $category_index => $category ) {
					bemke_college_render_qa_admin_category( $category, 'category-' . $category_index );
				}
				?>
			</div>
		</section>

		<?php bemke_college_render_qa_admin_templates(); ?>
	</div>
	<?php
}

/**
 * Render one existing question editor row.
 *
 * @param array<string, mixed> $item Question data.
 */
function bemke_college_render_qa_admin_item( array $item, string $prefix, string $key ): void {
	$question  = isset( $item['question'] ) ? (string) $item['question'] : '';
	$answer    = isset( $item['answer'] ) ? (string) $item['answer'] : '';
	$safe_key  = sanitize_key( $key . '-' . wp_generate_password( 5, false, false ) );
	$editor_id = 'bemke-qa-answer-' . $safe_key;
	$body_id   = 'bemke-qa-item-body-' . $safe_key;
	?>
	<article class="bemke-qa-admin__item" data-qa-item>
		<div class="bemke-qa-admin__item-bar">
			<button type="button" class="bemke-qa-admin__drag" data-qa-drag-handle aria-label="Zmień kolejność pytania">
				<span class="dashicons dashicons-move" aria-hidden="true"></span>
			</button>
			<button type="button" class="bemke-qa-admin__disclosure bemke-qa-admin__disclosure--item" data-qa-toggle-item aria-expanded="true" aria-controls="<?php echo esc_attr( $body_id ); ?>">
				<strong data-qa-item-label><?php echo esc_html( $question ?: 'Nowe pytanie' ); ?></strong>
				<span class="dashicons dashicons-arrow-up-alt2" aria-hidden="true"></span>
			</button>
			<button type="button" class="button-link-delete" data-qa-remove-item>Usuń pytanie</button>
		</div>
		<div id="<?php echo esc_attr( $body_id ); ?>" class="bemke-qa-admin__item-fields" data-qa-item-body>
			<label class="bemke-qa-admin__field">
				<span>Pytanie</span>
				<input type="text" name="<?php echo esc_attr( $prefix . '[' . $safe_key . '][question]' ); ?>" value="<?php echo esc_attr( $question ); ?>" data-qa-question>
			</label>
			<div class="bemke-qa-admin__field">
				<span>Odpowiedź</span>
				<?php
				wp_editor(
					$answer,
					$editor_id,
					array(
						'textarea_name' => $prefix . '[' . $safe_key . '][answer]',
						'textarea_rows' => 6,
						'media_buttons' => false,
						'teeny'         => true,
						'quicktags'     => true,
					)
				);
				?>
			</div>
		</div>
	</article>
	<?php
}

/**
 * Render one existing category editor.
 *
 * @param array<string, mixed> $category Category data.
 */
function bemke_college_render_qa_admin_category( array $category, string $key ): void {
	$label     = isset( $category['label'] ) ? (string) $category['label'] : '';
	$items     = isset( $category['items'] ) && is_array( $category['items'] ) ? $category['items'] : array();
	$safe_key  = sanitize_key( $key . '-' . wp_generate_password( 5, false, false ) );
	$prefix    = 'bemke_college_qa_data[categories][' . $safe_key . ']';
	$target_id = 'bemke-qa-category-items-' . $safe_key;
	$body_id   = 'bemke-qa-category-body-' . $safe_key;
	?>
	<article class="bemke-qa-admin__category" data-qa-category>
		<div class="bemke-qa-admin__category-bar">
			<button type="button" class="bemke-qa-admin__drag" data-qa-category-drag aria-label="Zmień kolejność kategorii">
				<span class="dashicons dashicons-move" aria-hidden="true"></span>
			</button>
			<button type="button" class="bemke-qa-admin__disclosure bemke-qa-admin__disclosure--category" data-qa-toggle-category aria-expanded="true" aria-controls="<?php echo esc_attr( $body_id ); ?>" aria-label="Zwiń kategorię">
				<span class="dashicons dashicons-arrow-up-alt2" aria-hidden="true"></span>
			</button>
			<label>
				<span>Nazwa kategorii</span>
				<input type="text" name="<?php echo esc_attr( $prefix . '[label]' ); ?>" value="<?php echo esc_attr( $label ); ?>" placeholder="np. Programme">
			</label>
			<button type="button" class="button-link-delete" data-qa-remove-category>Usuń kategorię</button>
		</div>

		<div id="<?php echo esc_attr( $body_id ); ?>" class="bemke-qa-admin__category-body" data-qa-category-body>
			<div id="<?php echo esc_attr( $target_id ); ?>" class="bemke-qa-admin__items" data-qa-sortable-items>
				<?php
				foreach ( $items as $item_index => $item ) {
					bemke_college_render_qa_admin_item( $item, $prefix . '[items]', $safe_key . '-item-' . $item_index );
				}
				?>
			</div>

			<button type="button" class="button" data-qa-add-item data-target="<?php echo esc_attr( $target_id ); ?>" data-prefix="<?php echo esc_attr( $prefix . '[items]' ); ?>">Dodaj pytanie w tej kategorii</button>
		</div>
	</article>
	<?php
}

/**
 * Templates used when editors add rows without reloading the page.
 */
function bemke_college_render_qa_admin_templates(): void {
	?>
	<template id="bemke-qa-item-template">
		<article class="bemke-qa-admin__item" data-qa-item>
			<div class="bemke-qa-admin__item-bar">
				<button type="button" class="bemke-qa-admin__drag" data-qa-drag-handle aria-label="Zmień kolejność pytania"><span class="dashicons dashicons-move" aria-hidden="true"></span></button>
				<button type="button" class="bemke-qa-admin__disclosure bemke-qa-admin__disclosure--item" data-qa-toggle-item aria-expanded="true" aria-controls="bemke-qa-item-body-__EDITOR_KEY__">
					<strong data-qa-item-label>Nowe pytanie</strong>
					<span class="dashicons dashicons-arrow-up-alt2" aria-hidden="true"></span>
				</button>
				<button type="button" class="button-link-delete" data-qa-remove-item>Usuń pytanie</button>
			</div>
			<div id="bemke-qa-item-body-__EDITOR_KEY__" class="bemke-qa-admin__item-fields" data-qa-item-body>
				<label class="bemke-qa-admin__field">
					<span>Pytanie</span>
					<input type="text" name="__PREFIX__[__ITEM_KEY__][question]" value="" data-qa-question>
				</label>
				<div class="bemke-qa-admin__field">
					<span>Odpowiedź</span>
					<textarea id="bemke-qa-answer-__EDITOR_KEY__" name="__PREFIX__[__ITEM_KEY__][answer]" rows="6" data-qa-new-editor></textarea>
				</div>
			</div>
		</article>
	</template>

	<template id="bemke-qa-category-template">
		<article class="bemke-qa-admin__category" data-qa-category>
			<div class="bemke-qa-admin__category-bar">
				<button type="button" class="bemke-qa-admin__drag" data-qa-category-drag aria-label="Zmień kolejność kategorii"><span class="dashicons dashicons-move" aria-hidden="true"></span></button>
				<button type="button" class="bemke-qa-admin__disclosure bemke-qa-admin__disclosure--category" data-qa-toggle-category aria-expanded="true" aria-controls="bemke-qa-category-body-__CATEGORY_KEY__" aria-label="Zwiń kategorię"><span class="dashicons dashicons-arrow-up-alt2" aria-hidden="true"></span></button>
				<label>
					<span>Nazwa kategorii</span>
					<input type="text" name="bemke_college_qa_data[categories][__CATEGORY_KEY__][label]" value="" placeholder="np. Programme">
				</label>
				<button type="button" class="button-link-delete" data-qa-remove-category>Usuń kategorię</button>
			</div>
			<div id="bemke-qa-category-body-__CATEGORY_KEY__" class="bemke-qa-admin__category-body" data-qa-category-body>
				<div id="bemke-qa-category-items-__CATEGORY_KEY__" class="bemke-qa-admin__items" data-qa-sortable-items></div>
				<button type="button" class="button" data-qa-add-item data-target="bemke-qa-category-items-__CATEGORY_KEY__" data-prefix="bemke_college_qa_data[categories][__CATEGORY_KEY__][items]">Dodaj pytanie w tej kategorii</button>
			</div>
		</article>
	</template>
	<?php
}

/**
 * Render the relationship selector on every page edit screen.
 */
function bemke_college_render_page_qa_meta_box( WP_Post $post ): void {
	$selected_id = absint( get_post_meta( $post->ID, BEMKE_COLLEGE_QA_PAGE_SET_META, true ) );
	$sets        = get_posts(
		array(
			'post_type'      => BEMKE_COLLEGE_QA_POST_TYPE,
			'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
			'posts_per_page' => -1,
			'orderby'        => 'title',
			'order'          => 'ASC',
		)
	);

	wp_nonce_field( BEMKE_COLLEGE_QA_PAGE_NONCE_ACTION, BEMKE_COLLEGE_QA_PAGE_NONCE_NAME );
	?>
	<p>
		<label for="bemke-college-qa-set"><strong>Podpięty zestaw</strong></label>
	</p>
	<select id="bemke-college-qa-set" name="bemke_college_qa_set_id" class="widefat">
		<option value="0">— Brak Q&A —</option>
		<?php foreach ( $sets as $set ) : ?>
			<?php $status_object = get_post_status_object( $set->post_status ); ?>
			<option value="<?php echo esc_attr( (string) $set->ID ); ?>" <?php selected( $selected_id, $set->ID ); ?>>
				<?php echo esc_html( $set->post_title ?: '(bez nazwy)' ); ?><?php echo 'publish' === $set->post_status ? '' : ' — ' . esc_html( $status_object ? $status_object->label : $set->post_status ); ?>
			</option>
		<?php endforeach; ?>
	</select>

	<p class="description">
		Umieść <code>[bemke_college_qa]</code> w elemencie Shortcode w wybranym miejscu Bricks.
	</p>

	<?php if ( $selected_id && current_user_can( 'edit_post', $selected_id ) ) : ?>
		<p><a href="<?php echo esc_url( get_edit_post_link( $selected_id ) ); ?>">Edytuj podpięty zestaw Q&A</a></p>
	<?php endif; ?>
	<?php
}

/**
 * Store sanitized editor content as versioned JSON.
 */
function bemke_college_save_qa_set( int $post_id ): void {
	if ( ! bemke_college_can_save_qa_post( $post_id, BEMKE_COLLEGE_QA_NONCE_NAME, BEMKE_COLLEGE_QA_NONCE_ACTION ) ) {
		return;
	}

	$raw = isset( $_POST['bemke_college_qa_data'] ) && is_array( $_POST['bemke_college_qa_data'] )
		? wp_unslash( $_POST['bemke_college_qa_data'] )
		: array();
	$data = bemke_college_sanitize_qa_data( $raw );
	$json = wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

	if ( false !== $json ) {
		update_post_meta( $post_id, BEMKE_COLLEGE_QA_DATA_META, wp_slash( $json ) );
	}
}

/**
 * Store the selected set on the page itself.
 */
function bemke_college_save_page_qa_assignment( int $post_id ): void {
	if ( ! bemke_college_can_save_qa_post( $post_id, BEMKE_COLLEGE_QA_PAGE_NONCE_NAME, BEMKE_COLLEGE_QA_PAGE_NONCE_ACTION ) ) {
		return;
	}

	$set_id = isset( $_POST['bemke_college_qa_set_id'] ) ? absint( $_POST['bemke_college_qa_set_id'] ) : 0;

	if ( $set_id && BEMKE_COLLEGE_QA_POST_TYPE === get_post_type( $set_id ) ) {
		update_post_meta( $post_id, BEMKE_COLLEGE_QA_PAGE_SET_META, $set_id );
	} else {
		delete_post_meta( $post_id, BEMKE_COLLEGE_QA_PAGE_SET_META );
	}
}

/**
 * Shared save guard for native meta boxes.
 */
function bemke_college_can_save_qa_post( int $post_id, string $nonce_name, string $nonce_action ): bool {
	if ( wp_is_post_autosave( $post_id ) || wp_is_post_revision( $post_id ) ) {
		return false;
	}

	if ( ! isset( $_POST[ $nonce_name ] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST[ $nonce_name ] ) ), $nonce_action ) ) {
		return false;
	}

	return current_user_can( 'edit_post', $post_id );
}

/**
 * Sanitize all nested Q&A content while preserving editor order.
 *
 * @param array<string, mixed> $raw Raw submitted values.
 * @return array<string, mixed>
 */
function bemke_college_sanitize_qa_data( array $raw ): array {
	$plain_items = isset( $raw['plain_items'] ) && is_array( $raw['plain_items'] )
		? bemke_college_sanitize_qa_items( $raw['plain_items'] )
		: array();
	$categories  = array();

	if ( isset( $raw['categories'] ) && is_array( $raw['categories'] ) ) {
		foreach ( $raw['categories'] as $category ) {
			if ( ! is_array( $category ) ) {
				continue;
			}

			$items = isset( $category['items'] ) && is_array( $category['items'] )
				? bemke_college_sanitize_qa_items( $category['items'] )
				: array();

			if ( empty( $items ) ) {
				continue;
			}

			$categories[] = array(
				'label' => isset( $category['label'] ) ? sanitize_text_field( $category['label'] ) : '',
				'items' => $items,
			);
		}
	}

	return array(
		'version'     => 1,
		'heading'     => isset( $raw['heading'] ) && '' !== trim( (string) $raw['heading'] ) ? sanitize_text_field( $raw['heading'] ) : 'Q&A',
		'variant'     => isset( $raw['variant'] ) && 'categorized' === $raw['variant'] ? 'categorized' : 'plain',
		'open_first'  => ! empty( $raw['open_first'] ),
		'plain_items' => $plain_items,
		'categories'  => $categories,
	);
}

/**
 * Sanitize a question collection.
 *
 * @param array<mixed> $items Raw question rows.
 * @return array<int, array<string, string>>
 */
function bemke_college_sanitize_qa_items( array $items ): array {
	$sanitized = array();

	foreach ( $items as $item ) {
		if ( ! is_array( $item ) ) {
			continue;
		}

		$question = isset( $item['question'] ) ? sanitize_text_field( $item['question'] ) : '';
		$answer   = isset( $item['answer'] ) ? wp_kses_post( $item['answer'] ) : '';

		if ( '' === $question ) {
			continue;
		}

		$sanitized[] = array(
			'question' => $question,
			'answer'   => $answer,
		);
	}

	return $sanitized;
}

/**
 * Load the purpose-built admin UI only on Q&A edit screens.
 */
function bemke_college_enqueue_qa_admin_assets( string $hook_suffix ): void {
	$screen = get_current_screen();

	if ( ! $screen || BEMKE_COLLEGE_QA_POST_TYPE !== $screen->post_type || ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
		return;
	}

	wp_enqueue_editor();
	wp_enqueue_script( 'jquery-ui-sortable' );

	$dev_server = function_exists( 'bemke_college_vite_dev_server' ) ? bemke_college_vite_dev_server() : '';

	if ( $dev_server ) {
		wp_enqueue_script( 'bemke-college-vite-client', $dev_server . '/@vite/client', array(), null, false );
		wp_enqueue_script( 'bemke-college-qa-admin', $dev_server . '/src/qa-admin.js', array( 'bemke-college-vite-client', 'jquery-ui-sortable' ), null, false );
		return;
	}

	$manifest = function_exists( 'bemke_college_vite_manifest' ) ? bemke_college_vite_manifest() : array();
	$entry    = isset( $manifest['src/qa-admin.js'] ) ? $manifest['src/qa-admin.js'] : array();
	$dist_uri = trailingslashit( get_stylesheet_directory_uri() ) . 'dist/';

	if ( ! empty( $entry['css'] ) && is_array( $entry['css'] ) ) {
		foreach ( $entry['css'] as $index => $css_file ) {
			wp_enqueue_style( 'bemke-college-qa-admin-' . $index, $dist_uri . $css_file, array(), null );
		}
	}

	if ( ! empty( $entry['file'] ) ) {
		wp_enqueue_script( 'bemke-college-qa-admin', $dist_uri . $entry['file'], array( 'jquery-ui-sortable' ), null, false );
	}
}

/**
 * Register the placement shortcode.
 */
function bemke_college_register_qa_shortcode(): void {
	add_shortcode( 'bemke_college_qa', 'bemke_college_qa_shortcode' );
}

/**
 * Render a selected or explicitly named Q&A set.
 *
 * @param array<string, mixed> $atts Shortcode attributes.
 */
function bemke_college_qa_shortcode( array $atts = array() ): string {
	$atts = shortcode_atts( array( 'id' => 0 ), $atts, 'bemke_college_qa' );
	$page_id = get_queried_object_id();
	$set_id  = absint( $atts['id'] );

	if ( ! $set_id && $page_id ) {
		$set_id = absint( get_post_meta( $page_id, BEMKE_COLLEGE_QA_PAGE_SET_META, true ) );
	}

	$output = bemke_college_render_qa_set( $set_id );

	return $output;
}

/**
 * Build one complete frontend section.
 */
function bemke_college_render_qa_set( int $set_id ): string {
	if ( ! $set_id || BEMKE_COLLEGE_QA_POST_TYPE !== get_post_type( $set_id ) || 'publish' !== get_post_status( $set_id ) ) {
		return '';
	}

	$data        = bemke_college_get_qa_data( $set_id );
	$instance    = 'bemke-qa-' . $set_id;
	$categorized = 'categorized' === $data['variant'];

	if ( $categorized ) {
		$categories = array_values(
			array_filter(
				$data['categories'],
				static function ( $category ): bool {
					return is_array( $category ) && ! empty( $category['items'] );
				}
			)
		);

		if ( empty( $categories ) ) {
			return '';
		}
	} elseif ( empty( $data['plain_items'] ) ) {
		return '';
	}

	ob_start();
	?>
	<section class="bemke-qa bemke-qa--<?php echo $categorized ? 'categorized' : 'plain'; ?>" data-bemke-qa>
		<div class="bemke-qa__inner">
			<h2 class="bemke-qa__heading"><?php echo esc_html( (string) $data['heading'] ); ?></h2>

			<?php if ( $categorized ) : ?>
				<nav class="bemke-qa__tabs" aria-label="<?php echo esc_attr( (string) $data['heading'] ); ?>">
					<?php foreach ( $categories as $category_index => $category ) : ?>
						<?php $panel_id = $instance . '-category-' . ( $category_index + 1 ); ?>
						<a class="bemke-qa__tab<?php echo 0 === $category_index ? ' is-active' : ''; ?>" href="#<?php echo esc_attr( $panel_id ); ?>" data-qa-tab>
							<?php echo esc_html( (string) ( $category['label'] ?: 'Q&A ' . ( $category_index + 1 ) ) ); ?>
						</a>
					<?php endforeach; ?>
				</nav>

				<div class="bemke-qa__category-panels">
					<?php foreach ( $categories as $category_index => $category ) : ?>
						<?php $panel_id = $instance . '-category-' . ( $category_index + 1 ); ?>
						<section id="<?php echo esc_attr( $panel_id ); ?>" class="bemke-qa__category-panel" data-qa-panel>
							<h3 class="bemke-qa__category-title"><?php echo esc_html( (string) ( $category['label'] ?: 'Q&A ' . ( $category_index + 1 ) ) ); ?></h3>
							<?php echo bemke_college_render_qa_items( $category['items'], ! empty( $data['open_first'] ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</section>
					<?php endforeach; ?>
				</div>
			<?php else : ?>
				<?php echo bemke_college_render_qa_items( $data['plain_items'], ! empty( $data['open_first'] ) ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
			<?php endif; ?>
		</div>
	</section>
	<?php
	return (string) ob_get_clean();
}

/**
 * Render accessible native disclosure rows.
 *
 * @param array<int, array<string, string>> $items Question rows.
 */
function bemke_college_render_qa_items( array $items, bool $open_first ): string {
	ob_start();
	?>
	<div class="bemke-qa__items">
		<?php foreach ( array_values( $items ) as $index => $item ) : ?>
			<?php
			$question = isset( $item['question'] ) ? (string) $item['question'] : '';
			$answer   = isset( $item['answer'] ) ? (string) $item['answer'] : '';
			if ( '' === $question ) {
				continue;
			}
			?>
			<details class="bemke-qa__item" <?php echo $open_first && 0 === $index ? 'open' : ''; ?>>
				<summary class="bemke-qa__summary">
					<span class="bemke-qa__bullet" aria-hidden="true"></span>
					<span class="bemke-qa__number" aria-hidden="true"><?php echo esc_html( str_pad( (string) ( $index + 1 ), 2, '0', STR_PAD_LEFT ) ); ?></span>
					<span class="bemke-qa__question"><?php echo esc_html( $question ); ?></span>
					<span class="bemke-qa__icon" aria-hidden="true"></span>
				</summary>
				<div class="bemke-qa__answer">
					<div class="bemke-qa__answer-inner"><?php echo wp_kses_post( wpautop( $answer ) ); ?></div>
				</div>
			</details>
		<?php endforeach; ?>
	</div>
	<?php
	return (string) ob_get_clean();
}

/**
 * Add useful context to the Q&A list screen.
 *
 * @param array<string, string> $columns Existing columns.
 * @return array<string, string>
 */
function bemke_college_qa_admin_columns( array $columns ): array {
	return array(
		'cb'             => isset( $columns['cb'] ) ? $columns['cb'] : '<input type="checkbox">',
		'title'          => 'Nazwa zestawu',
		'qa_variant'     => 'Wariant',
		'qa_assignments' => 'Podpięte strony',
		'date'           => isset( $columns['date'] ) ? $columns['date'] : 'Data',
	);
}

/**
 * Render custom list-table values.
 */
function bemke_college_render_qa_admin_column( string $column, int $post_id ): void {
	if ( 'qa_variant' === $column ) {
		$data = bemke_college_get_qa_data( $post_id );
		echo esc_html( 'categorized' === $data['variant'] ? 'Z kategoriami' : 'Bez kategorii' );
		return;
	}

	if ( 'qa_assignments' !== $column ) {
		return;
	}

	$pages = get_posts(
		array(
			'post_type'      => 'page',
			'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
			'posts_per_page' => -1,
			'orderby'        => 'title',
			'order'          => 'ASC',
			'meta_key'       => BEMKE_COLLEGE_QA_PAGE_SET_META,
			'meta_value'     => $post_id,
		)
	);

	if ( empty( $pages ) ) {
		echo '<span aria-hidden="true">—</span><span class="screen-reader-text">Brak podpiętych stron</span>';
		return;
	}

	$links = array();
	foreach ( $pages as $page ) {
		$links[] = sprintf( '<a href="%s">%s</a>', esc_url( get_edit_post_link( $page->ID ) ), esc_html( $page->post_title ?: '(bez tytułu)' ) );
	}

	echo wp_kses_post( implode( ', ', $links ) );
}

/**
 * Show the relationship from the opposite direction on the Pages screen.
 *
 * @param array<string, string> $columns Existing columns.
 * @return array<string, string>
 */
function bemke_college_page_qa_admin_column( array $columns ): array {
	$result = array();

	foreach ( $columns as $key => $label ) {
		if ( 'date' === $key ) {
			$result['bemke_qa_set'] = 'Q&A';
		}

		$result[ $key ] = $label;
	}

	if ( ! isset( $result['bemke_qa_set'] ) ) {
		$result['bemke_qa_set'] = 'Q&A';
	}

	return $result;
}

/**
 * Render the assigned set in the Pages list table.
 */
function bemke_college_render_page_qa_admin_column( string $column, int $post_id ): void {
	if ( 'bemke_qa_set' !== $column ) {
		return;
	}

	$set_id = absint( get_post_meta( $post_id, BEMKE_COLLEGE_QA_PAGE_SET_META, true ) );

	if ( ! $set_id || BEMKE_COLLEGE_QA_POST_TYPE !== get_post_type( $set_id ) ) {
		echo '<span aria-hidden="true">—</span><span class="screen-reader-text">Brak podpiętego zestawu Q&amp;A</span>';
		return;
	}

	$title = get_the_title( $set_id ) ?: '(bez nazwy)';
	$url   = get_edit_post_link( $set_id );

	if ( $url && current_user_can( 'edit_post', $set_id ) ) {
		printf( '<a href="%s">%s</a>', esc_url( $url ), esc_html( $title ) );
		return;
	}

	echo esc_html( $title );
}
