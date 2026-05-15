<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Service;

use Drupal\Core\Form\FormBuilderInterface;
use Drupal\Core\Session\AccountProxyInterface;
use Psr\Log\LoggerInterface;

class FormSerializer {

  public function __construct(
    private readonly FormBuilderInterface $formBuilder,
    private readonly AccountProxyInterface $currentUser,
    private readonly LoggerInterface $logger,
  ) {}

  public function serialize(string $form_id): array {
    try {
      $form = $this->formBuilder->getForm($form_id);
      return $this->serializeElements($form);
    }
    catch (\Throwable $e) {
      $this->logger->error('drupal_react_form: cannot serialize @form — @msg', [
        '@form' => $form_id,
        '@msg'  => $e->getMessage(),
      ]);
      return [];
    }
  }

  private function serializeElements(array $form): array {
    $result = [];
    foreach ($form as $key => $element) {
      if (!is_string($key)) {
        continue;
      }
      if (str_starts_with($key, '#') || str_starts_with($key, '_')) {
        continue;
      }
      if (!is_array($element) || !isset($element['#type'])) {
        continue;
      }
      $result[$key] = $this->serializeElement($key, $element);
    }
    uasort($result, static fn(array $a, array $b): int => ($a['weight'] ?? 0) <=> ($b['weight'] ?? 0));
    return $result;
  }

  private function serializeElement(string $key, array $el): array {
    $data = [
      'key'                => $key,
      'type'               => $el['#type'],
      'title'              => isset($el['#title']) ? (string) $el['#title'] : null,
      'description'        => isset($el['#description']) ? (string) $el['#description'] : null,
      'descriptionDisplay' => $el['#description_display'] ?? 'after',
      'required'           => (bool) ($el['#required'] ?? FALSE),
      'defaultValue'       => $el['#default_value'] ?? null,
      'value'              => $el['#value'] ?? null,
      'placeholder'        => $el['#placeholder'] ?? null,
      'disabled'           => (bool) ($el['#disabled'] ?? FALSE),
      'multiple'           => (bool) ($el['#multiple'] ?? FALSE),
      'options'            => $this->serializeOptions($el['#options'] ?? []),
      'attributes'         => $el['#attributes'] ?? [],
      'states'             => $this->serializeStates($el['#states'] ?? []),
      'access'             => (bool) ($el['#access'] ?? TRUE),
      'weight'             => (int) ($el['#weight'] ?? 0),
      'maxlength'          => $el['#maxlength'] ?? null,
      'min'                => $el['#min'] ?? null,
      'max'                => $el['#max'] ?? null,
      'step'               => $el['#step'] ?? null,
      'rows'               => $el['#rows'] ?? null,
      'cols'               => $el['#cols'] ?? null,
      'prefix'             => $el['#prefix'] ?? null,
      'suffix'             => $el['#suffix'] ?? null,
      'titleDisplay'       => $el['#title_display'] ?? 'before',
      'children'           => $this->serializeChildren($el),
    ];

    return array_filter($data, static fn($v): bool => $v !== null && $v !== '' && $v !== []);
  }

  private function serializeOptions(array $options): array {
    $result = [];
    foreach ($options as $value => $label) {
      if (is_array($label)) {
        foreach ($label as $subValue => $subLabel) {
          $result[] = ['value' => (string) $subValue, 'label' => (string) $subLabel, 'group' => (string) $value];
        }
      }
      else {
        $result[] = ['value' => (string) $value, 'label' => (string) $label];
      }
    }
    return $result;
  }

  private function serializeStates(array $states): array {
    $result = [];
    foreach ($states as $state => $conditions) {
      if (!is_array($conditions)) {
        continue;
      }
      foreach ($conditions as $selector => $condition) {
        if (!is_string($selector) || !is_array($condition)) {
          continue;
        }
        preg_match('/\[name=["\']([^"\']+)["\']\]/', $selector, $m);
        $field = $m[1] ?? $selector;
        $conditionKey = (string) array_key_first($condition);
        $conditionVal = reset($condition);
        $result[$state][] = ['field' => $field, 'condition' => $conditionKey, 'value' => $conditionVal];
      }
    }
    return $result;
  }

  private function serializeChildren(array $el): array {
    if (!in_array($el['#type'] ?? '', ['fieldset', 'details', 'container', 'form'], TRUE)) {
      return [];
    }
    return $this->serializeElements($el);
  }

}
