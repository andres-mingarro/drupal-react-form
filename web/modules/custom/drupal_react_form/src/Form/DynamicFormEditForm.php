<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\drupal_react_form\Service\DynamicFormStorage;

class DynamicFormEditForm extends FormBase {

  private ?string $formIdParam = NULL;

  private function storage(): DynamicFormStorage {
    return \Drupal::service('drupal_react_form.dynamic_form_storage');
  }

  public function getFormId(): string {
    return 'drupal_react_form_edit_form';
  }

  private function fieldTypeOptions(): array {
    return [
      (string) $this->t('Texto') => [
        'textfield'        => $this->t('Text field'),
        'email'            => $this->t('Email'),
        'password'         => $this->t('Password'),
        'password_confirm' => $this->t('Password confirm'),
        'textarea'         => $this->t('Textarea'),
        'number'           => $this->t('Number'),
        'tel'              => $this->t('Telephone'),
        'url'              => $this->t('URL'),
        'search'           => $this->t('Search'),
      ],
      (string) $this->t('Selección') => [
        'select'     => $this->t('Select'),
        'checkbox'   => $this->t('Checkbox'),
        'checkboxes' => $this->t('Checkboxes'),
        'radio'      => $this->t('Radio'),
        'radios'     => $this->t('Radios'),
      ],
      (string) $this->t('Fecha') => [
        'date'     => $this->t('Date'),
        'datetime' => $this->t('Date & time'),
      ],
      (string) $this->t('Archivo') => [
        'file'         => $this->t('File'),
        'managed_file' => $this->t('Managed file'),
      ],
      (string) $this->t('Layout') => [
        'fieldset'  => $this->t('Fieldset'),
        'details'   => $this->t('Details'),
        'container' => $this->t('Container'),
      ],
      (string) $this->t('Otros') => [
        'hidden' => $this->t('Hidden'),
        'submit' => $this->t('Submit'),
      ],
    ];
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $this->formIdParam = $this->getRouteMatch()->getParameter('form_id');
    $is_edit = $this->formIdParam !== NULL;

    if ($form_state->get('fields') === NULL) {
      $stored_fields = [];
      if ($is_edit) {
        $record = $this->storage()->load($this->formIdParam);
        if ($record) {
          $stored_fields = json_decode($record['fields'], TRUE) ?? [];
          $form_state->set('label', $record['label']);
        }
      }
      $form_state->set('fields', $stored_fields);
    }

    $form['#tree'] = TRUE;

    $form['label'] = [
      '#type'          => 'textfield',
      '#title'         => $this->t('Label'),
      '#required'      => TRUE,
      '#default_value' => $form_state->get('label') ?? $form_state->getValue('label') ?? '',
      '#maxlength'     => 255,
    ];

    if (!$is_edit) {
      $form['id'] = [
        '#type'        => 'textfield',
        '#title'       => $this->t('ID (machine name)'),
        '#required'    => TRUE,
        '#description' => $this->t('Solo letras minúsculas, números y guiones bajos. Ej: <code>contact_form</code>'),
        '#maxlength'   => 64,
        '#pattern'     => '[a-z0-9_]+',
        '#attributes'  => ['pattern' => '[a-z0-9_]+'],
      ];
    }

    $fields = $form_state->get('fields');

    $form['fields_table'] = [
      '#type'       => 'table',
      '#caption'    => $this->t('Campos del formulario'),
      '#header'     => [
        '',
        $this->t('Key'),
        $this->t('Tipo'),
        $this->t('Label'),
        $this->t('Requerido'),
        $this->t('Descripción'),
        $this->t('Opciones (select/radios/checkboxes)'),
        $this->t('Peso'),
        $this->t('Quitar'),
      ],
      '#tabledrag'  => [
        [
          'action'       => 'order',
          'relationship' => 'sibling',
          'group'        => 'field-weight',
        ],
      ],
      '#empty'      => $this->t('No hay campos. Agregá uno con el botón de abajo.'),
    ];

    foreach ($fields as $delta => $field) {
      $form['fields_table'][$delta] = $this->buildFieldRow($delta, $field, $form_state);
    }

    $form['add_field'] = [
      '#type'                    => 'submit',
      '#value'                   => $this->t('+ Agregar campo'),
      '#submit'                  => ['::addField'],
      '#limit_validation_errors' => [],
      '#button_type'             => 'secondary',
    ];

    $form['actions'] = [
      '#type'   => 'actions',
      'submit'  => [
        '#type'        => 'submit',
        '#value'       => $is_edit ? $this->t('Guardar cambios') : $this->t('Crear formulario'),
        '#button_type' => 'primary',
      ],
    ];

    return $form;
  }

  private function buildFieldRow(int $delta, array $field, FormStateInterface $form_state): array {
    $row = [
      '#attributes' => ['class' => ['draggable']],
      'handle'      => [
        '#markup' => '',
        '#wrapper_attributes' => ['class' => ['tabledrag-handle']],
      ],
      'key' => [
        '#type'          => 'textfield',
        '#title'         => $this->t('Key'),
        '#title_display' => 'invisible',
        '#default_value' => $field['key'] ?? '',
        '#size'          => 20,
        '#pattern'       => '[a-zA-Z_][a-zA-Z0-9_]*',
        '#attributes'    => ['pattern' => '[a-zA-Z_][a-zA-Z0-9_]*', 'placeholder' => 'field_key'],
      ],
      'type' => [
        '#type'          => 'select',
        '#title'         => $this->t('Tipo'),
        '#title_display' => 'invisible',
        '#options'       => $this->fieldTypeOptions(),
        '#default_value' => $field['type'] ?? 'textfield',
      ],
      'title' => [
        '#type'          => 'textfield',
        '#title'         => $this->t('Label'),
        '#title_display' => 'invisible',
        '#default_value' => $field['title'] ?? '',
        '#size'          => 25,
        '#attributes'    => ['placeholder' => $this->t('Label del campo')],
      ],
      'required' => [
        '#type'          => 'checkbox',
        '#title'         => $this->t('Requerido'),
        '#title_display' => 'invisible',
        '#default_value' => (bool) ($field['required'] ?? FALSE),
      ],
      'description' => [
        '#type'          => 'textfield',
        '#title'         => $this->t('Descripción'),
        '#title_display' => 'invisible',
        '#default_value' => $field['description'] ?? '',
        '#size'          => 30,
        '#attributes'    => ['placeholder' => $this->t('Opcional')],
      ],
      'options' => [
        '#type'          => 'textarea',
        '#title'         => $this->t('Opciones'),
        '#title_display' => 'invisible',
        '#default_value' => $this->optionsToText($field['options'] ?? []),
        '#rows'          => 3,
        '#description'   => $this->t('Una por línea: <code>valor|Etiqueta</code>'),
        '#attributes'    => ['placeholder' => "opcion_1|Opción 1\nopcion_2|Opción 2", 'style' => 'min-width:180px;font-size:0.8rem;'],
        '#states'        => [
          'visible' => [
            'select[name="fields_table[' . $delta . '][type]"]' => [
              ['value' => 'select'],
              ['value' => 'checkboxes'],
              ['value' => 'radios'],
            ],
          ],
        ],
      ],
      'weight' => [
        '#type'          => 'weight',
        '#title'         => $this->t('Peso'),
        '#title_display' => 'invisible',
        '#default_value' => (int) ($field['weight'] ?? $delta),
        '#delta'         => 20,
        '#attributes'    => ['class' => ['field-weight']],
      ],
      'remove' => [
        '#type'                    => 'submit',
        '#value'                   => $this->t('Quitar'),
        '#name'                    => 'remove_field_' . $delta,
        '#submit'                  => ['::removeField'],
        '#limit_validation_errors' => [],
        '#button_type'             => 'danger',
        '#delta'                   => $delta,
      ],
    ];

    return $row;
  }

  private function optionsToText(array $options): string {
    return implode("\n", array_map(
      static fn(array $o): string => ($o['value'] !== $o['label'])
        ? $o['value'] . '|' . $o['label']
        : $o['label'],
      $options,
    ));
  }

  private function textToOptions(string $text): array {
    $options = [];
    foreach (array_filter(array_map('trim', explode("\n", $text))) as $line) {
      if (str_contains($line, '|')) {
        [$value, $label] = explode('|', $line, 2);
        $options[] = ['value' => trim($value), 'label' => trim($label)];
      }
      else {
        $options[] = ['value' => $line, 'label' => $line];
      }
    }
    return $options;
  }

  public function addField(array &$form, FormStateInterface $form_state): void {
    $fields = $form_state->get('fields');
    $fields[] = [
      'key'         => '',
      'type'        => 'textfield',
      'title'       => '',
      'required'    => FALSE,
      'description' => '',
      'options'     => [],
      'weight'      => count($fields),
    ];
    $form_state->set('fields', $fields);
    $form_state->set('label', $form_state->getValue('label'));
    $form_state->setRebuild(TRUE);
  }

  public function removeField(array &$form, FormStateInterface $form_state): void {
    $trigger = $form_state->getTriggeringElement();
    $delta = $trigger['#delta'] ?? NULL;

    if ($delta !== NULL) {
      $fields = $form_state->get('fields');
      array_splice($fields, $delta, 1);
      $form_state->set('fields', array_values($fields));
    }

    $form_state->set('label', $form_state->getValue('label'));
    $form_state->setRebuild(TRUE);
  }

  public function validateForm(array &$form, FormStateInterface $form_state): void {
    $is_edit = $this->getRouteMatch()->getParameter('form_id') !== NULL;

    if (!$is_edit) {
      $id = $form_state->getValue('id');
      if (!preg_match('/^[a-z0-9_]+$/', (string) $id)) {
        $form_state->setErrorByName('id', $this->t('El ID solo puede contener letras minúsculas, números y guiones bajos.'));
      }
      elseif ($this->storage()->load($id)) {
        $form_state->setErrorByName('id', $this->t('Ya existe un formulario con el ID "@id".', ['@id' => $id]));
      }
    }
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $form_id_param = $this->getRouteMatch()->getParameter('form_id');
    $is_edit = $form_id_param !== NULL;

    $form_id = $is_edit ? $form_id_param : $form_state->getValue('id');
    $label = $form_state->getValue('label');

    $raw_fields = $form_state->getValue('fields_table') ?? [];
    $fields = [];
    foreach ($raw_fields as $delta => $row) {
      $key = trim((string) ($row['key'] ?? ''));
      if ($key === '') {
        continue;
      }
      $fields[] = [
        'key'         => $key,
        'type'        => $row['type'] ?? 'textfield',
        'title'       => $row['title'] ?? '',
        'required'    => (bool) ($row['required'] ?? FALSE),
        'description' => $row['description'] ?? '',
        'options'     => $this->textToOptions($row['options'] ?? ''),
        'weight'      => (int) ($row['weight'] ?? $delta),
      ];
    }

    usort($fields, static fn($a, $b) => $a['weight'] <=> $b['weight']);

    $this->storage()->save([
      'id'     => $form_id,
      'label'  => $label,
      'fields' => json_encode($fields, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    $this->messenger()->addStatus($this->t('Formulario "@label" guardado.', ['@label' => $label]));
    $form_state->setRedirectUrl(Url::fromRoute('drupal_react_form.admin_list'));
  }

}
