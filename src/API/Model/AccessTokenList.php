<?php

/*
 * This file is part of the Kimai time-tracking app.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace App\API\Model;

use JMS\Serializer\Annotation as Serializer;

#[Serializer\ExclusionPolicy('all')]
final class AccessTokenList
{
    #[Serializer\Expose]
    #[Serializer\Groups(['Default'])]
    #[Serializer\Type(name: 'integer')]
    public readonly ?int $id;
    #[Serializer\Expose]
    #[Serializer\Groups(['Default'])]
    #[Serializer\Type(name: 'string')]
    public readonly ?string $name;
    #[Serializer\Expose]
    #[Serializer\Groups(['Default'])]
    #[Serializer\Type(name: 'DateTimeImmutable')]
    public readonly ?\DateTimeImmutable $lastUsage;

    public function __construct(\App\Entity\AccessToken $accessToken)
    {
        $this->id = $accessToken->getId();
        $this->name = $accessToken->getName();
        $this->lastUsage = $accessToken->getLastUsage();
    }
}
