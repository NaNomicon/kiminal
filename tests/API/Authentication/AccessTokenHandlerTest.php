<?php

/*
 * This file is part of the Kimai time-tracking app.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\Tests\API\Authentication;

use App\API\Authentication\AccessTokenHandler;
use App\Entity\AccessToken;
use App\Entity\User;
use App\Repository\AccessTokenRepository;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Cache\Adapter\ArrayAdapter;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\RateLimiter\Storage\CacheStorage;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

#[CoversClass(AccessTokenHandler::class)]
class AccessTokenHandlerTest extends TestCase
{
    private function getSut(?AccessToken $accessToken = null): AccessTokenHandler
    {
        $userProvider = $this->createMock(AccessTokenRepository::class);
        $userProvider->method('findByToken')->willReturn($accessToken);

        // Accept all validation attempts by default so only the auth logic is under test.
        $limiterFactory = new RateLimiterFactory(
            ['id' => 'test', 'policy' => 'fixed_window', 'limit' => 100, 'interval' => '1 minute'],
            new CacheStorage(new ArrayAdapter())
        );

        $requestStack = $this->createMock(RequestStack::class);

        return new AccessTokenHandler($userProvider, $limiterFactory, $requestStack);
    }

    public function testUnknownToken(): void
    {
        $this->expectException(BadCredentialsException::class);
        $this->expectExceptionMessage('Invalid credentials.');
        $sut = $this->getSut();
        $sut->getUserBadgeFrom('foo');
    }

    public function testInvalidToken(): void
    {
        $user = new User();
        $user->setUserIdentifier('foo');
        $accessToken = new AccessToken($user, 'Test');
        $accessToken->setExpiresAt(new \DateTimeImmutable('-1 day'));

        $this->expectException(BadCredentialsException::class);
        $this->expectExceptionMessage('Invalid token.');
        $sut = $this->getSut($accessToken);
        $sut->getUserBadgeFrom('foo');
    }

    public function testValidTokenSetsLastUsage(): void
    {
        $user = new User();
        $user->setUserIdentifier('foo-bar');
        $accessToken = new AccessToken($user, 'Test');
        self::assertNull($accessToken->getLastUsage());
        $sut = $this->getSut($accessToken);

        $badge = $sut->getUserBadgeFrom('foo');
        self::assertNotNull($accessToken->getLastUsage());
        self::assertSame('foo-bar', $badge->getUserIdentifier());
    }
}
