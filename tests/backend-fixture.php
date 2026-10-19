<?php
// Disposable browser-test account. This script refuses the working database.
require '/var/www/html/vendor/autoload.php';
$app = require '/var/www/html/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (app()->environment() !== 'testing' || Illuminate\Support\Facades\DB::connection()->getDatabaseName() !== 'umss_testing') {
    throw new RuntimeException('Solo se permite APP_ENV=testing y DB_DATABASE=umss_testing.');
}
App\Models\User::firstOrNew(['email' => 'frontend-ui@example.test'])->forceFill([
    'name' => 'Prueba de frontend',
    'password' => Illuminate\Support\Facades\Hash::make('FrontendIntegration2026!'),
    'is_admin' => true,
    'can_view_contacts' => true,
])->save();
echo "Cuenta desechable creada exclusivamente en umss_testing.\n";
