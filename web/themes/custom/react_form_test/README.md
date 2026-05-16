# React Form Test

Minimal Drupal theme for testing the `drupal_react_form` module.

## Enable

```bash
lando drush theme:enable react_form_test
lando drush config:set system.theme default react_form_test -y
lando drush cr
```

## Files

- `react_form_test.info.yml`: theme definition and regions.
- `react_form_test.libraries.yml`: global CSS library.
- `react_form_test.theme`: small safe hooks only.
- `css/global.css`: compiled theme styles.
- `sass/global.scss`: source styles.
