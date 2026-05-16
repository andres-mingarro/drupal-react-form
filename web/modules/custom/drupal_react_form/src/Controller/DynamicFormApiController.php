<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Database\Connection;
use Drupal\drupal_react_form\Service\DynamicFormStorage;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class DynamicFormApiController extends ControllerBase {

  public function __construct(
    private readonly DynamicFormStorage $dynamicFormStorage,
    private readonly Connection $db,
    private readonly LoggerInterface $logger,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('drupal_react_form.dynamic_form_storage'),
      $container->get('database'),
      $container->get('logger.channel.default'),
    );
  }

  public function getDefinition(string $form_id, Request $request): JsonResponse {
    $record = $this->dynamicFormStorage->load($form_id);

    if (!$record) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Form not found'], 404);
    }

    $raw_fields = json_decode($record['fields'], TRUE) ?? [];
    $elements = [];

    foreach ($raw_fields as $field) {
      $key = $field['key'] ?? '';
      if ($key === '') {
        continue;
      }
      $element = [
        'key'         => $key,
        'type'        => $field['type'] ?? 'textfield',
        'title'       => $field['title'] ?? '',
        'required'    => (bool) ($field['required'] ?? FALSE),
        'description' => $field['description'] ?? '',
        'weight'      => (int) ($field['weight'] ?? 0),
      ];

      $options = $field['options'] ?? [];
      if (!empty($options)) {
        $element['options'] = $options;
      }

      $elements[$key] = array_filter($element, static fn($v) => $v !== '');
    }

    return new JsonResponse(
      ['success' => TRUE, 'form_id' => $form_id, 'elements' => $elements],
      200,
      [
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Headers' => 'Content-Type, X-CSRF-Token',
      ],
    );
  }

  public function getSubmissions(string $form_id): JsonResponse {
    $record = $this->dynamicFormStorage->load($form_id);
    if (!$record) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Form not found'], 404);
    }

    $rows = $this->db->select('drupal_react_form_submissions', 's')
      ->fields('s', ['id', 'data', 'uid', 'created'])
      ->condition('s.form_id', $form_id)
      ->orderBy('s.created', 'DESC')
      ->range(0, 20)
      ->execute()
      ->fetchAll(\PDO::FETCH_ASSOC);

    $submissions = array_map(static function (array $row): array {
      return [
        'id'      => (int) $row['id'],
        'data'    => json_decode($row['data'], TRUE) ?? [],
        'uid'     => (int) $row['uid'],
        'created' => (int) $row['created'],
      ];
    }, $rows);

    return new JsonResponse(
      ['success' => TRUE, 'form_id' => $form_id, 'submissions' => $submissions],
      200,
      ['Access-Control-Allow-Origin' => '*'],
    );
  }

  public function submitForm(string $form_id, Request $request): JsonResponse {
    $record = $this->dynamicFormStorage->load($form_id);

    if (!$record) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Form not found'], 404);
    }

    $data = json_decode($request->getContent(), TRUE) ?? [];

    $this->db->insert('drupal_react_form_submissions')
      ->fields([
        'form_id' => $form_id,
        'data'    => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'uid'     => (int) $this->currentUser()->id(),
        'created' => time(),
      ])
      ->execute();

    $this->logger->info('drupal_react_form: "@id" submission saved (uid=@uid)', [
      '@id'  => $form_id,
      '@uid' => $this->currentUser()->id(),
    ]);

    return new JsonResponse([
      'success' => TRUE,
      'form_id' => $form_id,
    ]);
  }

}
