<?php

/*
 * This file is part of the Kimai time-tracking app.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\Tests\Security;

use PHPUnit\Framework\Attributes\Group;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Http\AccessMapInterface;

/**
 * Regression test for the 2FA-API-bypass security advisory.
 *
 * The firewall-level access_control for ^/api is IS_AUTHENTICATED_FULLY so that
 * a TwoFactorToken (which only satisfies IS_AUTHENTICATED) and remember-me
 * sessions can no longer reach any /api/* route. Kiminal has no web-frontend
 * session auth, so only fully authenticated Bearer-token requests are allowed.
 */
#[Group('integration')]
class ApiAccessControlTest extends KernelTestCase
{
    public function testApiRouteRequiresFullyAuthenticated(): void
    {
        self::bootKernel();
        $accessMap = self::getContainer()->get('security.access_map');
        self::assertInstanceOf(AccessMapInterface::class, $accessMap);

        [$attributes] = $accessMap->getPatterns(Request::create('/api/users/me'));

        self::assertIsArray($attributes);
        self::assertContains(
            'IS_AUTHENTICATED_FULLY',
            $attributes,
            'API access_control must require IS_AUTHENTICATED_FULLY to keep a TwoFactorToken or remember-me session from reaching /api/*'
        );
        self::assertNotContains(
            'IS_AUTHENTICATED',
            $attributes,
            'API access_control must not fall back to IS_AUTHENTICATED, which a TwoFactorToken satisfies'
        );
    }
}
