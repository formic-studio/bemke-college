<?php
/**
 * Native contact form shortcode and server-side message routing.
 *
 * @package BemkeCollege
 */

defined( 'ABSPATH' ) || exit;

const BEMKE_COLLEGE_CONTACT_ACTION     = 'bemke_college_contact';
const BEMKE_COLLEGE_CONTACT_NONCE_NAME = 'bemke_college_contact_nonce';
const BEMKE_COLLEGE_CONTACT_RATE_LIMIT = 30;

add_action( 'init', 'bemke_college_register_contact_form_shortcode' );
add_action( 'admin_post_' . BEMKE_COLLEGE_CONTACT_ACTION, 'bemke_college_handle_contact_form' );
add_action( 'admin_post_nopriv_' . BEMKE_COLLEGE_CONTACT_ACTION, 'bemke_college_handle_contact_form' );

/**
 * Register the contact form shortcode.
 */
function bemke_college_register_contact_form_shortcode(): void {
	add_shortcode( 'bemke_college_contact_form', 'bemke_college_render_contact_form' );
}

/**
 * Return contact topics and their trusted server-side recipients.
 *
 * The primary address is used as To and the optional extra addresses as Cc.
 * Never expose these values as form option values.
 *
 * @return array<string, array{label: string, to: string, cc: array<int, string>}>
 */
function bemke_college_contact_topics(): array {
	$topics = array(
		'admissions'                 => array(
			'label' => 'Admissions',
			'to'    => 'admissions@bemke.pl',
			'cc'    => array( 'katarzyna.baran@bemke.pl' ),
		),
		'scholarships-financial-aid' => array(
			'label' => 'Scholarships & Financial Aid',
			'to'    => 'admissions@bemke.pl',
			'cc'    => array( 'katarzyna.baran@bemke.pl' ),
		),
		'open-days-school-visits'    => array(
			'label' => 'Open Days & School Visits',
			'to'    => 'admissions@bemke.pl',
			'cc'    => array(),
		),
		'fees-payments'              => array(
			'label' => 'Fees & Payments',
			'to'    => 'katarzyna.baran@bemke.pl',
			'cc'    => array(),
		),
		'safeguarding'               => array(
			'label' => 'Safeguarding',
			'to'    => 'erik.lutley@bemke.pl',
			'cc'    => array(),
		),
		'careers'                    => array(
			'label' => 'Careers',
			'to'    => 'erik.lutley@bemke.pl',
			'cc'    => array(),
		),
		'press-media'                => array(
			'label' => 'Press & Media',
			'to'    => 'anna.kutrzuba@bemke.pl',
			'cc'    => array(),
		),
		'marketing'                  => array(
			'label' => 'Marketing',
			'to'    => 'marta.stach@bemke.pl',
			'cc'    => array(),
		),
		'partnerships-support'       => array(
			'label' => 'Partnerships & Support',
			'to'    => 'katarzyna.ostrowska@bemke.pl',
			'cc'    => array(),
		),
		'general-enquiry'            => array(
			'label' => 'General Enquiry',
			'to'    => 'admissions@bemke.pl',
			'cc'    => array(),
		),
	);

	/**
	 * Filter the contact topics and their recipients.
	 *
	 * @param array<string, array{label: string, to: string, cc: array<int, string>}> $topics Contact topics.
	 */
	return apply_filters( 'bemke_college_contact_topics', $topics );
}

/**
 * Render the contact form.
 */
function bemke_college_render_contact_form(): string {
	static $instance = 0;

	++$instance;

	$prefix             = 'bemke-contact-' . $instance;
	$privacy_policy_url = get_privacy_policy_url();
	$status             = isset( $_GET['bemke-contact'] ) && is_scalar( $_GET['bemke-contact'] )
		? sanitize_key( wp_unslash( (string) $_GET['bemke-contact'] ) ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		: '';
	$status_message     = '';
	$status_class       = '';

	if ( 'sent' === $status ) {
		$status_message = 'Thank you. Your message has been sent.';
		$status_class   = ' is-success';
	} elseif ( 'error' === $status ) {
		$status_message = 'We could not send your message. Please try again.';
		$status_class   = ' is-error';
	}

	if ( ! $privacy_policy_url ) {
		$privacy_policy_url = home_url( '/privacy-policy/' );
	}

	ob_start();
	?>
	<div class="bemke-contact-form-shell">
		<form
			class="bemke-contact-form"
			data-bemke-contact-form
			action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
			method="post"
		>
			<input type="hidden" name="action" value="<?php echo esc_attr( BEMKE_COLLEGE_CONTACT_ACTION ); ?>">
			<input type="hidden" name="bemke_contact_ajax" value="0" data-bemke-contact-ajax>
			<input type="hidden" name="bemke_contact_created_at" value="<?php echo esc_attr( (string) time() ); ?>">
			<input type="hidden" name="bemke_contact_source" value="<?php echo esc_url( get_permalink() ); ?>">
			<?php wp_nonce_field( BEMKE_COLLEGE_CONTACT_ACTION, BEMKE_COLLEGE_CONTACT_NONCE_NAME ); ?>

			<div class="bemke-contact-form__trap" aria-hidden="true">
				<label for="<?php echo esc_attr( $prefix ); ?>-company">Company website</label>
				<input id="<?php echo esc_attr( $prefix ); ?>-company" name="bemke_contact_company" type="text" tabindex="-1" autocomplete="off">
			</div>

			<div class="bemke-contact-form__grid">
				<div class="bemke-contact-form__field">
					<label for="<?php echo esc_attr( $prefix ); ?>-first-name">First name <span aria-hidden="true">*</span></label>
					<input id="<?php echo esc_attr( $prefix ); ?>-first-name" name="first_name" type="text" autocomplete="given-name" maxlength="100" placeholder="First name" required>
				</div>

				<div class="bemke-contact-form__field">
					<label for="<?php echo esc_attr( $prefix ); ?>-last-name">Surname <span aria-hidden="true">*</span></label>
					<input id="<?php echo esc_attr( $prefix ); ?>-last-name" name="last_name" type="text" autocomplete="family-name" maxlength="100" placeholder="Surname" required>
				</div>

				<div class="bemke-contact-form__field">
					<label for="<?php echo esc_attr( $prefix ); ?>-email">Email address <span aria-hidden="true">*</span></label>
					<input id="<?php echo esc_attr( $prefix ); ?>-email" name="email" type="email" autocomplete="email" maxlength="320" placeholder="Email address" required>
				</div>

				<div class="bemke-contact-form__field">
					<label for="<?php echo esc_attr( $prefix ); ?>-phone">Telephone</label>
					<input id="<?php echo esc_attr( $prefix ); ?>-phone" name="phone" type="tel" autocomplete="tel" maxlength="50" placeholder="Telephone">
				</div>
			</div>

			<div class="bemke-contact-form__field">
				<label for="<?php echo esc_attr( $prefix ); ?>-topic">Select who you wish to contact <span aria-hidden="true">*</span></label>
				<div class="bemke-contact-form__select-wrap">
					<select id="<?php echo esc_attr( $prefix ); ?>-topic" name="topic" required>
						<option value="" selected disabled>Please select</option>
						<?php foreach ( bemke_college_contact_topics() as $topic_key => $topic ) : ?>
							<option value="<?php echo esc_attr( $topic_key ); ?>"><?php echo esc_html( $topic['label'] ); ?></option>
						<?php endforeach; ?>
					</select>
				</div>
			</div>

			<div class="bemke-contact-form__field">
				<label for="<?php echo esc_attr( $prefix ); ?>-message">Message <span aria-hidden="true">*</span></label>
				<textarea id="<?php echo esc_attr( $prefix ); ?>-message" name="message" rows="4" maxlength="5000" placeholder="Message" required></textarea>
			</div>

			<label class="bemke-contact-form__consent">
				<input name="privacy" type="checkbox" value="1" required>
				<span>I have read the <a href="<?php echo esc_url( $privacy_policy_url ); ?>">Privacy Policy</a> and understand how my data will be used to respond to this enquiry. <span aria-hidden="true">*</span></span>
			</label>

			<p class="bemke-contact-form__status<?php echo esc_attr( $status_class ); ?>" data-bemke-contact-status role="status" aria-live="polite" tabindex="-1"><?php echo esc_html( $status_message ); ?></p>

			<div class="bemke-contact-form__submit">
				<button class="bemke-contact-form__button" type="submit" data-bemke-contact-submit>
					<span class="bemke-contact-form__button-label">Send message</span>
					<span class="bemke-contact-form__button-loading" aria-hidden="true">Sending…</span>
				</button>
			</div>
		</form>
	</div>
	<?php

	return (string) ob_get_clean();
}

/**
 * Read a scalar POST value and sanitize it as plain text.
 */
function bemke_college_contact_post_text( string $key ): string {
	if ( ! isset( $_POST[ $key ] ) || ! is_scalar( $_POST[ $key ] ) ) {
		return '';
	}

	return sanitize_text_field( wp_unslash( (string) $_POST[ $key ] ) );
}

/**
 * Determine whether the request expects a JSON response.
 */
function bemke_college_contact_is_ajax_request(): bool {
	return '1' === bemke_college_contact_post_text( 'bemke_contact_ajax' );
}

/**
 * Return a consistent JSON response or redirect for the no-JavaScript fallback.
 */
function bemke_college_contact_respond( bool $success, string $message, int $status_code = 200 ): void {
	if ( bemke_college_contact_is_ajax_request() ) {
		$data = array( 'message' => $message );

		if ( $success ) {
			wp_send_json_success( $data, $status_code );
		}

		wp_send_json_error( $data, $status_code );
	}

	$redirect_url = wp_get_referer();

	if ( ! $redirect_url ) {
		$redirect_url = home_url( '/contact/' );
	}

	$redirect_url = remove_query_arg( 'bemke-contact', $redirect_url );
	$redirect_url = add_query_arg( 'bemke-contact', $success ? 'sent' : 'error', $redirect_url );

	wp_safe_redirect( $redirect_url );
	exit;
}

/**
 * Handle and deliver one contact enquiry.
 */
function bemke_college_handle_contact_form(): void {
	if ( 'POST' !== strtoupper( isset( $_SERVER['REQUEST_METHOD'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_METHOD'] ) ) : '' ) ) {
		bemke_college_contact_respond( false, 'Invalid request.', 405 );
	}

	$nonce = bemke_college_contact_post_text( BEMKE_COLLEGE_CONTACT_NONCE_NAME );

	if ( ! wp_verify_nonce( $nonce, BEMKE_COLLEGE_CONTACT_ACTION ) ) {
		bemke_college_contact_respond( false, 'Your session has expired. Refresh the page and try again.', 403 );
	}

	if ( '' !== bemke_college_contact_post_text( 'bemke_contact_company' ) ) {
		bemke_college_contact_respond( true, 'Thank you. Your message has been sent.' );
	}

	$created_at = absint( bemke_college_contact_post_text( 'bemke_contact_created_at' ) );

	if ( $created_at && time() - $created_at < 2 ) {
		bemke_college_contact_respond( false, 'Please wait a moment and try again.', 429 );
	}

	$first_name = bemke_college_contact_post_text( 'first_name' );
	$last_name  = bemke_college_contact_post_text( 'last_name' );
	$email      = sanitize_email( bemke_college_contact_post_text( 'email' ) );
	$phone      = bemke_college_contact_post_text( 'phone' );
	$topic_key  = sanitize_key( bemke_college_contact_post_text( 'topic' ) );
	$message    = isset( $_POST['message'] ) && is_scalar( $_POST['message'] )
		? sanitize_textarea_field( wp_unslash( (string) $_POST['message'] ) )
		: '';
	$privacy    = '1' === bemke_college_contact_post_text( 'privacy' );
	$source     = isset( $_POST['bemke_contact_source'] ) && is_scalar( $_POST['bemke_contact_source'] )
		? esc_url_raw( wp_unslash( (string) $_POST['bemke_contact_source'] ) )
		: '';
	$topics     = bemke_college_contact_topics();

	if (
		'' === $first_name ||
		'' === $last_name ||
		! is_email( $email ) ||
		'' === $message ||
		strlen( $first_name ) > 100 ||
		strlen( $last_name ) > 100 ||
		strlen( $email ) > 320 ||
		strlen( $phone ) > 50 ||
		strlen( $message ) > 5000 ||
		! $privacy ||
		! isset( $topics[ $topic_key ] )
	) {
		bemke_college_contact_respond( false, 'Complete all required fields and check their values.', 422 );
	}

	$remote_address = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
	$rate_key       = 'bemke_contact_' . hash( 'sha256', strtolower( $email ) . '|' . $remote_address );

	if ( get_transient( $rate_key ) ) {
		bemke_college_contact_respond( false, 'Your previous message is still being processed. Please wait a moment.', 429 );
	}

	$topic = $topics[ $topic_key ];
	$to    = sanitize_email( $topic['to'] );
	$cc    = array_values( array_filter( array_map( 'sanitize_email', $topic['cc'] ), 'is_email' ) );

	if ( ! is_email( $to ) ) {
		bemke_college_contact_respond( false, 'The selected contact route is temporarily unavailable.', 500 );
	}

	$subject = sprintf(
		'[Bemke College] %1$s — %2$s %3$s',
		$topic['label'],
		$first_name,
		$last_name
	);
	$body    = implode(
		"\n",
		array(
			'New enquiry from the Bemke College website',
			'',
			'Topic: ' . $topic['label'],
			'Name: ' . $first_name . ' ' . $last_name,
			'Email: ' . $email,
			'Telephone: ' . ( $phone ? $phone : 'Not provided' ),
			'Source: ' . ( $source ? $source : 'Not provided' ),
			'',
			'Message:',
			$message,
		)
	);
	$headers = array(
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . $email,
	);

	foreach ( $cc as $cc_address ) {
		$headers[] = 'Cc: ' . $cc_address;
	}

	if ( ! wp_mail( $to, $subject, $body, $headers ) ) {
		bemke_college_contact_respond( false, 'We could not send your message. Please try again.', 500 );
	}

	set_transient( $rate_key, 1, BEMKE_COLLEGE_CONTACT_RATE_LIMIT );
	bemke_college_contact_respond( true, 'Thank you. Your message has been sent.' );
}
