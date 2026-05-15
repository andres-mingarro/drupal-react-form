<?php

declare(strict_types=1);

namespace Drupal\drupal_react_form\Form;

use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;

class DemoForm extends FormBase {

  public function getFormId(): string {
    return 'drupal_react_form_demo';
  }

  public function buildForm(array $form, FormStateInterface $form_state): array {
    $form['nombre'] = [
      '#type'        => 'textfield',
      '#title'       => 'Nombre completo',
      '#placeholder' => 'Ej: Juan Pérez',
      '#required'    => TRUE,
      '#description' => 'Ingresá tu nombre y apellido.',
      '#weight'      => 0,
    ];

    $form['email'] = [
      '#type'        => 'email',
      '#title'       => 'Correo electrónico',
      '#placeholder' => 'ejemplo@correo.com',
      '#required'    => TRUE,
      '#weight'      => 1,
    ];

    $form['password'] = [
      '#type'   => 'password',
      '#title'  => 'Contraseña',
      '#weight' => 2,
    ];

    $form['password_confirm'] = [
      '#type'   => 'password_confirm',
      '#title'  => 'Confirmar contraseña',
      '#weight' => 3,
    ];

    $form['edad'] = [
      '#type'        => 'number',
      '#title'       => 'Edad',
      '#min'         => 1,
      '#max'         => 120,
      '#step'        => 1,
      '#description' => 'Tu edad en años.',
      '#weight'      => 4,
    ];

    $form['telefono'] = [
      '#type'        => 'tel',
      '#title'       => 'Teléfono',
      '#placeholder' => '+54 11 1234-5678',
      '#weight'      => 5,
    ];

    $form['sitio_web'] = [
      '#type'        => 'url',
      '#title'       => 'Sitio web',
      '#placeholder' => 'https://misitioweb.com',
      '#weight'      => 6,
    ];

    $form['bio'] = [
      '#type'        => 'textarea',
      '#title'       => 'Biografía',
      '#rows'        => 4,
      '#placeholder' => 'Contanos algo sobre vos...',
      '#description' => 'Máximo 500 caracteres.',
      '#maxlength'   => 500,
      '#weight'      => 7,
    ];

    $form['pais'] = [
      '#type'    => 'select',
      '#title'   => 'País',
      '#options' => [
        'ar' => 'Argentina',
        'uy' => 'Uruguay',
        'cl' => 'Chile',
        'br' => 'Brasil',
        'mx' => 'México',
        'es' => 'España',
      ],
      '#empty_option' => '— Seleccioná un país —',
      '#weight'       => 8,
    ];

    $form['intereses'] = [
      '#type'    => 'checkboxes',
      '#title'   => 'Intereses',
      '#options' => [
        'tech'    => 'Tecnología',
        'design'  => 'Diseño',
        'music'   => 'Música',
        'sports'  => 'Deportes',
        'cooking' => 'Cocina',
      ],
      '#weight'  => 9,
    ];

    $form['genero'] = [
      '#type'    => 'radios',
      '#title'   => 'Género',
      '#options' => [
        'M' => 'Masculino',
        'F' => 'Femenino',
        'X' => 'No binario',
        'N' => 'Prefiero no decirlo',
      ],
      '#weight'  => 10,
    ];

    $form['fecha_nacimiento'] = [
      '#type'   => 'date',
      '#title'  => 'Fecha de nacimiento',
      '#weight' => 11,
    ];

    $form['color_favorito'] = [
      '#type'          => 'color',
      '#title'         => 'Color favorito',
      '#default_value' => '#3b82f6',
      '#weight'        => 12,
    ];

    $form['nivel_experiencia'] = [
      '#type'          => 'range',
      '#title'         => 'Nivel de experiencia',
      '#min'           => 0,
      '#max'           => 10,
      '#step'          => 1,
      '#default_value' => 5,
      '#description'   => 'Del 0 (principiante) al 10 (experto).',
      '#weight'        => 13,
    ];

    $form['acepta_terminos'] = [
      '#type'     => 'checkbox',
      '#title'    => 'Acepto los términos y condiciones',
      '#required' => TRUE,
      '#weight'   => 14,
    ];

    $form['avatar'] = [
      '#type'        => 'file',
      '#title'       => 'Avatar',
      '#description' => 'Subí una imagen de perfil (JPG, PNG, GIF).',
      '#weight'      => 15,
    ];

    $form['datos_extra'] = [
      '#type'   => 'fieldset',
      '#title'  => 'Datos adicionales (fieldset)',
      '#weight' => 16,
      'empresa' => [
        '#type'        => 'textfield',
        '#title'       => 'Empresa',
        '#placeholder' => 'Donde trabajás',
      ],
      'cargo' => [
        '#type'        => 'textfield',
        '#title'       => 'Cargo',
        '#placeholder' => 'Tu puesto',
      ],
    ];

    $form['mostrar_redes'] = [
      '#type'   => 'details',
      '#title'  => 'Redes sociales (expandible)',
      '#weight' => 17,
      'twitter' => [
        '#type'        => 'textfield',
        '#title'       => 'Twitter / X',
        '#placeholder' => '@usuario',
      ],
      'linkedin' => [
        '#type'        => 'textfield',
        '#title'       => 'LinkedIn',
        '#placeholder' => 'URL de tu perfil',
      ],
    ];

    $form['submit'] = [
      '#type'   => 'submit',
      '#value'  => 'Guardar perfil',
      '#weight' => 20,
    ];

    return $form;
  }

  public function submitForm(array &$form, FormStateInterface $form_state): void {}

}
