import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';

const localSnippet = {
  id: 'custom-regression-drill',
  title: 'Tiny regression drill',
  language: 'TypeScript',
  tier: 'Small',
  description: 'A short fixture for keyboard regression checks.',
  code: 'abc',
  custom: true,
};

function resetBrowser() {
  window.localStorage.clear();
  window.history.pushState({}, '', '/');
  document.documentElement.removeAttribute('style');
  vi.stubGlobal('crypto', { randomUUID: () => 'regression-run-id' });
}

function renderPracticeWithLocalSnippet() {
  window.localStorage.setItem('codesprint_custom_snippets', JSON.stringify([localSnippet]));
  return render(<App />);
}

function navigate(testId: string) {
  fireEvent.click(screen.getAllByTestId(testId)[0]);
}

describe('typing drill regressions', () => {
  beforeEach(resetBrowser);

  it('starts a drill, shows correct and incorrect feedback, supports backspace, and records completion scoring', async () => {
    renderPracticeWithLocalSnippet();

    const snippetSelect = screen.getByTestId('select-practice-snippet') as HTMLSelectElement;
    fireEvent.change(snippetSelect, { target: { value: localSnippet.id } });
    fireEvent.click(screen.getByTestId('button-start-run'));

    const input = screen.getByTestId('input-code-capture');
    fireEvent.keyDown(input, { key: 'a' });
    expect(document.querySelectorAll('.code-correct')).toHaveLength(1);
    expect(document.querySelectorAll('.code-wrong')).toHaveLength(0);

    fireEvent.keyDown(input, { key: 'x' });
    await waitFor(() => {
      expect(document.querySelectorAll('.code-wrong')).toHaveLength(1);
      expect(screen.getByTestId('metric-accuracy').textContent).toContain('50%');
    });

    fireEvent.keyDown(input, { key: 'Backspace' });
    await waitFor(() => {
      expect(document.querySelectorAll('.code-wrong')).toHaveLength(0);
      expect(document.querySelectorAll('.code-correct')).toHaveLength(1);
    });

    fireEvent.keyDown(input, { key: 'b' });
    await waitFor(() => expect(document.querySelectorAll('.code-correct')).toHaveLength(2));
    fireEvent.keyDown(input, { key: 'c' });
    await waitFor(() => expect(screen.getByText('Run complete')).toBeTruthy());
    expect(screen.getByTestId('metric-earned').textContent).toMatch(/^\+/);

    const runs = JSON.parse(window.localStorage.getItem('codesprint_runs') ?? '[]');
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      snippetTitle: localSnippet.title,
      tier: localSnippet.tier,
      accuracy: 75,
      points: expect.any(Number),
    });
    expect(runs[0].points).toBeGreaterThan(0);
  });

  it('abandons an active run without saving a result', () => {
    renderPracticeWithLocalSnippet();

    fireEvent.change(screen.getByTestId('select-practice-snippet'), { target: { value: localSnippet.id } });
    fireEvent.click(screen.getByTestId('button-start-run'));
    fireEvent.keyDown(screen.getByTestId('input-code-capture'), { key: 'a' });
    fireEvent.click(screen.getByTestId('button-abandon-run'));

    expect(screen.getByTestId('button-start-run')).toBeTruthy();
    expect(screen.queryByTestId('input-code-capture')).toBeNull();
    expect(JSON.parse(window.localStorage.getItem('codesprint_runs') ?? '[]')).toEqual([]);
  });
});

describe('local library and workspace regressions', () => {
  beforeEach(resetBrowser);

  it('adds a local snippet and persists it in the browser library', async () => {
    render(<App />);
    navigate('link-nav-snippet-library');

    fireEvent.click(screen.getByTestId('button-add-snippet'));
    fireEvent.change(screen.getByTestId('input-snippet-title'), { target: { value: 'Response parser' } });
    fireEvent.change(screen.getByTestId('input-snippet-language'), { target: { value: 'TypeScript' } });
    fireEvent.change(screen.getByTestId('textarea-snippet-code'), { target: { value: 'return response.json();' } });
    fireEvent.click(screen.getByTestId('button-save-snippet'));

    expect(screen.getByText('Response parser')).toBeTruthy();
    expect(screen.getByTestId('status-notice').textContent).toContain('Snippet added');
    await waitFor(() => {
      const snippets = JSON.parse(window.localStorage.getItem('codesprint_custom_snippets') ?? '[]');
      expect(snippets).toEqual([
        expect.objectContaining({
          title: 'Response parser',
          language: 'TypeScript',
          tier: 'Small',
          code: 'return response.json();',
          custom: true,
        }),
      ]);
    });
  });

  it('switches palettes and persists the active CSS tokens', async () => {
    render(<App />);
    navigate('link-nav-workspace');

    fireEvent.click(screen.getByTestId('button-theme-ember'));
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('12 78% 72%');
    expect(JSON.parse(window.localStorage.getItem('codesprint_theme') ?? 'null')).toBe('ember');

    fireEvent.click(screen.getByTestId('button-theme-mint'));
    expect(document.documentElement.style.getPropertyValue('--primary')).toBe('148 56% 72%');
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem('codesprint_theme') ?? 'null')).toBe('mint'));
  });
});