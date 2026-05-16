<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\Core\Url;
use Drupal\drupal_react_form\Service\DynamicFormStorage;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;

class DynamicFormAdminController extends ControllerBase {

  public function __construct(
    private readonly DynamicFormStorage $dynamicFormStorage,
  ) {}

  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('drupal_react_form.dynamic_form_storage'),
    );
  }

  public function listForms(): array {
    $forms = $this->dynamicFormStorage->loadAll();

    $rows = [];
    foreach ($forms as $form) {
      $fields = json_decode($form['fields'] ?? '[]', TRUE) ?? [];
      $edit_url = Url::fromRoute('drupal_react_form.admin_edit', ['form_id' => $form['id']]);
      $delete_url = Url::fromRoute('drupal_react_form.admin_delete', ['form_id' => $form['id']], [
        'query' => ['token' => $this->csrfToken()->get('delete-form-' . $form['id'])],
      ]);

      $rows[] = [
        $form['label'],
        $form['id'],
        count($fields),
        [
          'data' => [
            '#type'  => 'operations',
            '#links' => [
              'edit' => [
                'title' => $this->t('Editar'),
                'url'   => $edit_url,
              ],
              'delete' => [
                'title'      => $this->t('Eliminar'),
                'url'        => $delete_url,
                'attributes' => ['class' => ['button', 'button--danger']],
              ],
            ],
          ],
        ],
      ];
    }

    return [
      'add_link' => [
        '#type'  => 'link',
        '#title' => $this->t('+ Agregar formulario'),
        '#url'   => Url::fromRoute('drupal_react_form.admin_add'),
        '#attributes' => ['class' => ['button', 'button--primary']],
        '#prefix' => '<p>',
        '#suffix' => '</p>',
      ],
      'table' => [
        '#type'   => 'table',
        '#header' => [
          $this->t('Label'),
          $this->t('ID'),
          $this->t('Campos'),
          $this->t('Operaciones'),
        ],
        '#rows'  => $rows,
        '#empty' => $this->t('No hay formularios definidos todavía.'),
      ],
    ];
  }

  public function deleteForm(string $form_id, Request $request): RedirectResponse {
    $token = $request->query->get('token', '');
    if (!$this->csrfToken()->validate((string) $token, 'delete-form-' . $form_id)) {
      $this->messenger()->addError($this->t('Token de seguridad inválido.'));
      return $this->redirect('drupal_react_form.admin_list');
    }

    $form = $this->dynamicFormStorage->load($form_id);
    if ($form) {
      $this->dynamicFormStorage->delete($form_id);
      $this->messenger()->addStatus($this->t('Formulario "@label" eliminado.', ['@label' => $form['label']]));
    }
    else {
      $this->messenger()->addWarning($this->t('El formulario "@id" no existe.', ['@id' => $form_id]));
    }

    return $this->redirect('drupal_react_form.admin_list');
  }

  private function csrfToken(): \Drupal\Core\Access\CsrfTokenGenerator {
    return \Drupal::service('csrf_token');
  }

}
