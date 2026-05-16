<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Controller;

use Drupal\Core\Controller\ControllerBase;
use Drupal\user\Entity\User;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

class UserReactFormController extends ControllerBase {

  public function getDefinition(int $uid): JsonResponse {
    $user = User::load($uid);

    if (!$user) {
      return new JsonResponse(['success' => FALSE, 'error' => 'User not found'], 404);
    }

    if (!$this->currentUser()->hasPermission('administer users') && (int) $this->currentUser()->id() !== $uid) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Access denied'], 403);
    }

    $tz_options = array_map(
      static fn(string $tz): array => ['value' => $tz, 'label' => $tz],
      \DateTimeZone::listIdentifiers(),
    );

    $is_admin = $this->currentUser()->hasPermission('administer users');

    $elements = [
      'name' => [
        'key'          => 'name',
        'type'         => 'textfield',
        'title'        => 'Nombre de usuario',
        'required'     => TRUE,
        'defaultValue' => $user->getAccountName(),
        'weight'       => 0,
      ],
      'mail' => [
        'key'          => 'mail',
        'type'         => 'email',
        'title'        => 'Correo electrónico',
        'required'     => TRUE,
        'defaultValue' => $user->getEmail(),
        'description'  => 'Se usa para iniciar sesión y recuperar contraseña.',
        'weight'       => 1,
      ],
      'pass' => [
        'key'         => 'pass',
        'type'        => 'password_confirm',
        'title'       => 'Contraseña',
        'description' => 'Dejá en blanco para no cambiarla.',
        'weight'      => 2,
      ],
      'timezone' => [
        'key'          => 'timezone',
        'type'         => 'select',
        'title'        => 'Zona horaria',
        'options'      => $tz_options,
        'defaultValue' => $user->getTimeZone() ?: 'UTC',
        'weight'       => 3,
      ],
      'user_picture' => [
        'key'         => 'user_picture',
        'type'        => 'managed_file',
        'title'       => 'Foto de perfil',
        'description' => 'JPG, PNG o GIF. Máx 2 MB.',
        'attributes'  => [
          'upload_url'  => "/api/react-form/user/{$uid}/upload/picture",
          'accept'      => 'image/*',
          'current_url' => $this->getUserPictureUrl($user),
        ],
        'weight'      => 10,
      ],
    ];

    if ($is_admin) {
      /** @var \Drupal\user\RoleInterface[] $all_roles */
      $all_roles    = $this->entityTypeManager()->getStorage('user_role')->loadMultiple();
      $role_options = [];
      foreach ($all_roles as $rid => $role) {
        if (in_array($rid, ['anonymous', 'authenticated'], TRUE)) {
          continue;
        }
        $role_options[] = ['value' => $rid, 'label' => $role->label()];
      }
      $user_roles = array_values(array_diff($user->getRoles(), ['authenticated']));

      $elements['status'] = [
        'key'          => 'status',
        'type'         => 'radios',
        'title'        => 'Estado',
        'options'      => [
          ['value' => '1', 'label' => 'Activo'],
          ['value' => '0', 'label' => 'Bloqueado'],
        ],
        'defaultValue' => $user->isActive() ? '1' : '0',
        'weight'       => 4,
      ];

      if (!empty($role_options)) {
        $elements['roles'] = [
          'key'          => 'roles',
          'type'         => 'checkboxes',
          'title'        => 'Roles',
          'options'      => $role_options,
          'defaultValue' => $user_roles,
          'weight'       => 5,
        ];
      }
    }

    $elements['submit'] = [
      'key'    => 'submit',
      'type'   => 'submit',
      'value'  => 'Guardar cambios',
      'weight' => 20,
    ];

    uasort($elements, static fn($a, $b) => ($a['weight'] ?? 0) <=> ($b['weight'] ?? 0));

    return new JsonResponse(
      ['success' => TRUE, 'form_id' => 'user_edit', 'uid' => $uid, 'elements' => $elements],
      200,
      ['Access-Control-Allow-Origin' => '*', 'Access-Control-Allow-Headers' => 'Content-Type, X-CSRF-Token'],
    );
  }

  public function submitForm(int $uid, Request $request): JsonResponse {
    $user = User::load($uid);
    if (!$user) {
      return new JsonResponse(['success' => FALSE, 'error' => 'User not found'], 404);
    }

    if (!$this->currentUser()->hasPermission('administer users') && (int) $this->currentUser()->id() !== $uid) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Access denied'], 403);
    }

    $data   = json_decode($request->getContent(), TRUE) ?? [];
    $errors = [];

    $userStorage = $this->entityTypeManager()->getStorage('user');

    if (!empty($data['name'])) {
      $name     = trim($data['name']);
      $existing = $userStorage->loadByProperties(['name' => $name]);
      $existing = reset($existing);
      if ($existing && (int) $existing->id() !== $uid) {
        $errors['name'] = 'Ese nombre de usuario ya está en uso.';
      }
      else {
        $user->setUsername($name);
      }
    }

    if (!empty($data['mail'])) {
      $mail = trim($data['mail']);
      if (!filter_var($mail, FILTER_VALIDATE_EMAIL)) {
        $errors['mail'] = 'El correo no es válido.';
      }
      else {
        $existing = $userStorage->loadByProperties(['mail' => $mail]);
        $existing = reset($existing);
        if ($existing && (int) $existing->id() !== $uid) {
          $errors['mail'] = 'Ese correo ya está en uso.';
        }
        else {
          $user->setEmail($mail);
        }
      }
    }

    if (!empty($data['pass'])) {
      $user->setPassword($data['pass']);
    }

    if (!empty($data['timezone'])) {
      $user->set('timezone', $data['timezone']);
    }

    $fid = $data['user_picture']['fid'] ?? $data['picture_fid'] ?? null;
    if (!empty($fid)) {
      $user->set('user_picture', ['target_id' => (int) $fid]);
    }

    if ($this->currentUser()->hasPermission('administer users')) {
      if (isset($data['status'])) {
        $user->set('status', (int) $data['status']);
      }
      if (isset($data['roles']) && is_array($data['roles'])) {
        $user->set('roles', array_values(array_filter($data['roles'])));
      }
    }

    if (!empty($errors)) {
      return new JsonResponse(['success' => FALSE, 'errors' => $errors], 422);
    }

    $user->save();

    return new JsonResponse([
      'success'     => TRUE,
      'message'     => 'Usuario actualizado correctamente.',
      'uid'         => $uid,
      'picture_url' => $this->getUserPictureUrl($user),
    ]);
  }

  public function uploadPicture(int $uid, Request $request): JsonResponse {
    $user = User::load($uid);
    if (!$user) {
      return new JsonResponse(['success' => FALSE, 'error' => 'User not found'], 404);
    }

    if (!$this->currentUser()->hasPermission('administer users') && (int) $this->currentUser()->id() !== $uid) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Access denied'], 403);
    }

    $file_data = $request->getContent();
    $filename  = $request->headers->get('X-Filename', 'picture.jpg');
    $filename  = \Drupal::service('file_system')->basename($filename);

    if (empty($file_data)) {
      return new JsonResponse(['success' => FALSE, 'error' => 'No file data received'], 400);
    }

    $directory = 'public://pictures';
    \Drupal::service('file_system')->prepareDirectory($directory, \Drupal\Core\File\FileSystemInterface::CREATE_DIRECTORY);

    /** @var \Drupal\file\FileRepositoryInterface $file_repo */
    $file_repo = \Drupal::service('file.repository');
    $file      = $file_repo->writeData($file_data, "{$directory}/{$filename}", \Drupal\Core\File\FileExists::Rename);

    if (!$file) {
      return new JsonResponse(['success' => FALSE, 'error' => 'Failed to save file'], 500);
    }

    $file->setPermanent();
    $file->save();

    return new JsonResponse([
      'success' => TRUE,
      'fid'     => $file->id(),
      'url'     => \Drupal::service('file_url_generator')->generateAbsoluteString($file->getFileUri()),
      'name'    => $file->getFilename(),
    ]);
  }

  private function getUserPictureUrl(User $user): string {
    $picture = $user->get('user_picture')->entity;
    if (!$picture) {
      return '';
    }
    return \Drupal::service('file_url_generator')->generateAbsoluteString($picture->getFileUri());
  }

  public function demoPage(int $uid): array {
    $user = User::load($uid);
    $name = $user ? $user->getDisplayName() : 'Usuario';

    return [
      '#type'     => 'inline_template',
      '#template' => '
        <div style="max-width:640px;margin:2rem auto;padding:0 1rem;">
          <h1>Editar perfil — {{ name }}</h1>
          <div data-react-form data-form-id="user:{{ uid }}"></div>
        </div>',
      '#context'  => ['uid' => $uid, 'name' => $name],
      '#attached' => [
        'library' => ['drupal_react_form/react-form-app'],
      ],
    ];
  }

}
