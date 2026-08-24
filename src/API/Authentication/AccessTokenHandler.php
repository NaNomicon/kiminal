<?php

/*
 * This file is part of the Kimai time-tracking app.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\API\Authentication;

use App\Repository\AccessTokenRepository;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Security\Core\Exception\BadCredentialsException;
use Symfony\Component\Security\Http\AccessToken\AccessTokenHandlerInterface;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;

final class AccessTokenHandler implements AccessTokenHandlerInterface
{
    public function __construct(
        private readonly AccessTokenRepository $accessTokenRepository,
        private readonly RateLimiterFactory $apiTokenValidationLimiter,
        private readonly RequestStack $requestStack,
    )
    {
    }

    public function getUserBadgeFrom(string $accessToken): UserBadge
    {
        $accessToken = $this->accessTokenRepository->findByToken($accessToken);

        if (null === $accessToken) {
            $this->rateLimitInvalidToken();
            throw new BadCredentialsException('Invalid credentials.');
        }

        if (!$accessToken->isValid()) {
            $this->rateLimitInvalidToken();
            throw new BadCredentialsException('Invalid token.');
        }

        $now = new \DateTimeImmutable();
        // record last usage only if this is the first time OR once every minute
        // ponytail: throttled to 1 write/min/token; still a write on every active token per minute. Add a batched/deferred update if token counts grow large.
        if ($accessToken->getLastUsage() === null || $now->getTimestamp() > $accessToken->getLastUsage()->getTimestamp() + 60) {
            $accessToken->setLastUsage($now);
            $this->accessTokenRepository->saveAccessToken($accessToken);
        }

        return new UserBadge($accessToken->getUser()->getUserIdentifier(), fn (string $userIdentifier) => $accessToken->getUser());
    }

    private function rateLimitInvalidToken(): void
    {
        $limiter = $this->apiTokenValidationLimiter->create($this->requestStack->getMainRequest()?->getClientIp());
        $limit = $limiter->consume();

        if (false === $limit->isAccepted()) {
            throw new BadRequestHttpException('Too many API requests with invalid token. Possible attack?');
        }
    }
}
