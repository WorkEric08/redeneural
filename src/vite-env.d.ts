interface ImportMetaEnv {
  /**
   * `'1'` só no build que vira APK (`scripts/build-android.mjs`). Dentro do
   * pacote o mundo é outro: o modelo viaja junto e nada precisa de rede.
   */
  readonly VITE_ANDROID?: string
}
