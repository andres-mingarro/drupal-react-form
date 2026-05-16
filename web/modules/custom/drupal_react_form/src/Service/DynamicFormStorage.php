<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Service;

use Drupal\Core\Database\Connection;

class DynamicFormStorage {

  public function __construct(
    private readonly Connection $db,
  ) {}

  public function loadAll(): array {
    return $this->db
      ->select('drupal_react_forms', 'f')
      ->fields('f')
      ->orderBy('label')
      ->execute()
      ->fetchAllAssoc('id', \PDO::FETCH_ASSOC);
  }

  public function load(string $id): ?array {
    $record = $this->db
      ->select('drupal_react_forms', 'f')
      ->fields('f')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return $record ?: NULL;
  }

  public function save(array $form): void {
    $existing = $this->load($form['id']);
    $now = time();

    if ($existing) {
      $this->db->update('drupal_react_forms')
        ->fields([
          'label'   => $form['label'],
          'fields'  => $form['fields'],
          'changed' => $now,
        ])
        ->condition('id', $form['id'])
        ->execute();
    }
    else {
      $this->db->insert('drupal_react_forms')
        ->fields([
          'id'      => $form['id'],
          'label'   => $form['label'],
          'fields'  => $form['fields'],
          'created' => $now,
          'changed' => $now,
        ])
        ->execute();
    }
  }

  public function delete(string $id): void {
    $this->db->delete('drupal_react_forms')
      ->condition('id', $id)
      ->execute();
  }

}
