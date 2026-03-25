use log::{error, info};
use std::panic;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info"))
        .format_timestamp_millis()
        .init();

    info!("Starting Aether Music Studio...");

    // Set up panic hook for logging
    let default_panic = panic::take_hook();
    panic::set_hook(Box::new(move |panic_info| {
        error!("Application panic: {}", panic_info);
        default_panic(panic_info);
    }));

    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|_app| {
            info!("Application setup complete");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}