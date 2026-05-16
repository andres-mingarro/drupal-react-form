<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\drupal_react_form\Service\FormSerializer;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class ReactFormController extends ControllerBase {

  public function __construct(
    private readonly FormSerializer $formSerializer,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('drupal_react_form.form_serializer'),
    );
  }

  public function demoPage(): array {
    return [
      '#type'     => 'inline_template',
      '#template' => '
        <div style="max-width:720px;margin:2rem auto;padding:0 1rem;">
          <h1>Demo — Drupal React Form</h1>
          <div data-react-form
               data-form-id="Drupal.drupal_react_form.Form.DemoForm"></div>
        </div>',
      '#attached' => [
        'library' => ['drupal_react_form/react-form-app'],
      ],
    ];
  }

  public function getDefinition(string $form_id, Request $request): JsonResponse {
    // Los puntos representan separadores de namespace (\) para evitar
    // que los browsers normalicen %5C como separador de path.
    $form_class = str_replace('.', '\\', $form_id);

    if (!preg_match('/^[a-zA-Z_.]+$/', $form_id)) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Invalid form ID'], 400);
    }

    $elements = $this->formSerializer->serialize($form_class);

    return new JsonResponse(
      ['success' => TRUE, 'form_id' => $form_id, 'elements' => $elements],
      200,
      [
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Headers' => 'Content-Type, X-CSRF-Token',
      ],
    );
  }

  public function submitForm(string $form_id, Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE) ?? [];

    return new JsonResponse([
      'success'  => TRUE,
      'received' => array_keys($data),
      'message'  => 'Form submitted successfully.',
    ]);
  }

}
