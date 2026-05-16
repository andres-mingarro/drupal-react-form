(function () {
  const OPEN_CLASS = 'is-submenu-open';

  const initDesktopSubmenus = () => {
    const menus = Array.from(document.querySelectorAll('.main-menu')).filter(
      (menu) => !menu.closest('[data-mobile-menu-panel]')
    );

    menus.forEach((menu) => {
      if (menu.dataset.desktopMenuInit === 'true') {
        return;
      }
      menu.dataset.desktopMenuInit = 'true';

      menu.querySelectorAll('.main-menu-item').forEach((item) => {
        const submenu = Array.from(item.children).find((child) =>
          child.classList.contains('main-menu-submenu')
        );
        const submenuInner = submenu
          ? submenu.querySelector('.main-menu-submenu-inner')
          : null;
        if (!submenuInner || submenuInner.childElementCount === 0) {
          return;
        }

        const setExpandedState = (isOpen) => {
          item.classList.toggle(OPEN_CLASS, isOpen);
        };

        // Collapse by default unless already open via class.
        setExpandedState(item.classList.contains(OPEN_CLASS));

        const openSubmenu = () => setExpandedState(true);
        const closeSubmenu = () => setExpandedState(false);

        const handleLeave = (event) => {
          const next = event.relatedTarget;
          // Do not close if moving inside the same menu item or its submenu.
          if (next && item.contains(next)) {
            return;
          }
          closeSubmenu();
        };

        item.addEventListener('mouseenter', openSubmenu);
        item.addEventListener('mouseleave', handleLeave);

        item.addEventListener('focusin', openSubmenu);
        item.addEventListener('focusout', (event) => {
          if (!item.contains(event.relatedTarget)) {
            closeSubmenu();
          }
        });

        submenu.addEventListener('mouseleave', handleLeave);

        const primaryLink = Array.from(item.children).find((child) => child.tagName === 'A');
        if (primaryLink) {
          primaryLink.addEventListener('click', (event) => {
            const isOpen = item.classList.contains(OPEN_CLASS);
            if (!isOpen) {
              event.preventDefault();
              setExpandedState(true);
            }
          });
        }

        document.addEventListener('click', (event) => {
          if (!item.contains(event.target)) {
            closeSubmenu();
          }
        });
      });
    });
  };

  const initHeaderSticky = () => {
    const header = document.querySelector('body');
    if (!header || header.dataset.stickyInit === 'true') {
      return;
    }
    header.dataset.stickyInit = 'true';

    const setStickyState = () => {
      const scrollTop =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      header.classList.toggle('header-sticky', scrollTop >= 200);
    };

    let rafId = null;
    const handleScroll = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        setStickyState();
        rafId = null;
      });
    };

    setStickyState();
    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initDesktopSubmenus();
      initHeaderSticky();
    });
  }
  else {
    initDesktopSubmenus();
    initHeaderSticky();
  }
})();
